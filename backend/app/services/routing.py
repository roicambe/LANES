import json
from typing import Any, Dict, List, Tuple
import httpx
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.models.report import ReportSeverity
from app.core.config import settings

ROUTE_LABELS = ["Recommended", "Alternative 1", "Alternative 2"]

def decode_polyline6(encoded_str: str) -> List[List[float]]:
    """Decodes Valhalla's 6-digit precision polyline string into GeoJSON [lng, lat] coordinates."""
    index = 0
    lat = 0
    lng = 0
    coordinates = []
    length = len(encoded_str)
    
    while index < length:
        shift = 0
        result = 0
        while True:
            b = ord(encoded_str[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlat = ~(result >> 1) if (result & 1) else (result >> 1)
        lat += dlat

        shift = 0
        result = 0
        while True:
            b = ord(encoded_str[index]) - 63
            index += 1
            result |= (b & 0x1f) << shift
            shift += 5
            if b < 0x20:
                break
        dlng = ~(result >> 1) if (result & 1) else (result >> 1)
        lng += dlng

        coordinates.append([lng / 1000000.0, lat / 1000000.0])
        
    return coordinates

def get_active_flood_polygons(db: Session) -> Tuple[List[List[List[float]]], List[List[List[float]]], List[List[List[float]]]]:
    """
    Fetches active flood avoidance zones and groups them by severity.
    Returns lists of Valhalla-compatible polygons (exterior rings).
    """
    zones = db.query(
        func.ST_AsGeoJSON(models.FloodAvoidanceZone.geometry).label("geojson"),
        models.FloodReport.severity
    ).join(
        models.FloodReport, models.FloodAvoidanceZone.report_id == models.FloodReport.id
    ).filter(
        models.FloodAvoidanceZone.is_active == True,
        (models.FloodAvoidanceZone.expires_at == None) | (models.FloodAvoidanceZone.expires_at > func.now())
    ).all()
    
    red_polygons = []
    orange_polygons = []
    yellow_polygons = []
    
    for z in zones:
        geom = json.loads(z.geojson)
        if geom["type"] == "Polygon" and len(geom["coordinates"]) > 0:
            exterior_ring = geom["coordinates"][0] # Valhalla expects an array of points for each polygon
            if z.severity == ReportSeverity.EXTREME:
                red_polygons.append(exterior_ring)
            elif z.severity in (ReportSeverity.HIGH, ReportSeverity.MEDIUM):
                orange_polygons.append(exterior_ring)
            else:
                yellow_polygons.append(exterior_ring)
                
    return red_polygons, orange_polygons, yellow_polygons

def request_valhalla_route(start: List[float], end: List[float], avoid_polygons: List[List[List[float]]] = None) -> Dict[str, Any]:
    """Queries the Valhalla server for routes between start and end coordinates, optionally avoiding polygons."""
    body = {
        "locations": [
            {"lat": start[1], "lon": start[0]},
            {"lat": end[1], "lon": end[0]}
        ],
        "costing": "auto",
        "alternates": 2,
        "units": "kilometers"
    }
    
    if avoid_polygons and len(avoid_polygons) > 0:
        body["avoid_polygons"] = avoid_polygons
        
    url = f"{settings.VALHALLA_URL}/route"
    
    try:
        response = httpx.post(url, json=body, timeout=10.0)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 400 and "avoid_polygons" in response.text:
             # If Valhalla rejects the route because it cannot avoid the polygons
             return None
        else:
            # For logging/debugging unhandled errors
            print(f"Valhalla Error: {response.text}")
            return None
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to communicate with Valhalla routing server: {exc}"
        )

def process_valhalla_response(data: Dict[str, Any], avoided_floods: bool = False, blocked: bool = False) -> List[Dict[str, Any]]:
    """Converts a Valhalla route response into our MultiRouteResponse candidate list."""
    if not data or "trip" not in data:
        return []
        
    candidates = []
    
    def extract_route(trip_data: Dict[str, Any], idx: int):
        if "legs" not in trip_data or len(trip_data["legs"]) == 0:
            return None
            
        leg = trip_data["legs"][0]
        summary = trip_data.get("summary", {})
        
        # Length is in km, convert to meters
        distance_m = summary.get("length", 0.0) * 1000
        duration_s = summary.get("time", 0.0)
        
        shape_str = leg.get("shape", "")
        coords = decode_polyline6(shape_str) if shape_str else []
        
        label = ROUTE_LABELS[idx] if idx < len(ROUTE_LABELS) else f"Alternative {idx}"
        
        return {
            "index": idx,
            "label": label,
            "geometry": {
                "type": "LineString",
                "coordinates": coords
            },
            "distance": distance_m,
            "duration": duration_s,
            "avoided_floods": avoided_floods,
            "blocked": blocked,
            "is_truncated": False # Valhalla generates native alternates, so we don't need distance heuristics
        }
        
    primary = extract_route(data["trip"], 0)
    if primary:
        candidates.append(primary)
        
    alternates = data.get("alternates", [])
    for i, alt in enumerate(alternates):
        alt_route = extract_route(alt.get("trip", {}), i + 1)
        if alt_route:
            candidates.append(alt_route)
            
    return candidates

def calculate_flood_safe_route(
    db: Session,
    start: List[float],
    end: List[float],
    ignore_floods: bool = False
) -> Dict[str, Any]:
    """Queries Valhalla to find a route, intelligently falling back on flood avoidance rules."""
    
    # 1. Fast path: completely ignore all floods
    if ignore_floods:
        data = request_valhalla_route(start, end)
        if not data:
            raise HTTPException(status_code=404, detail="No route options found by the pathfinding engine.")
        candidates = process_valhalla_response(data, avoided_floods=False, blocked=False)
        return {
            "routes": candidates,
            "recommended_index": 0
        }
        
    # 2. Get active flood polygons
    try:
        red, orange, yellow = get_active_flood_polygons(db)
    except Exception as e:
        print(f"Warning: Failed to fetch flood polygons ({e}). Bypassing flood avoidance.")
        red, orange, yellow = [], [], []
        
    all_floods = red + orange + yellow
    red_orange_floods = red + orange
    red_only = red
    
    # Attempt 1: Avoid EVERYTHING (Red, Orange, Yellow)
    if all_floods:
        data = request_valhalla_route(start, end, avoid_polygons=all_floods)
        if data:
            candidates = process_valhalla_response(data, avoided_floods=True, blocked=False)
            return {"routes": candidates, "recommended_index": 0}
            
    # Attempt 2: Trapped! Try avoiding only Red and Orange
    if red_orange_floods:
        data = request_valhalla_route(start, end, avoid_polygons=red_orange_floods)
        if data:
            candidates = process_valhalla_response(data, avoided_floods=True, blocked=True) 
            # Blocked=True because it passed through yellow
            return {"routes": candidates, "recommended_index": 0}
            
    # Attempt 3: Still Trapped! Try avoiding ONLY Red
    if red_only:
        data = request_valhalla_route(start, end, avoid_polygons=red_only)
        if data:
            candidates = process_valhalla_response(data, avoided_floods=True, blocked=True)
            return {"routes": candidates, "recommended_index": 0}
            
    # Attempt 4: Totally blocked or no floods exist. Route straight through.
    data = request_valhalla_route(start, end)
    if not data:
        raise HTTPException(status_code=404, detail="Destination unreachable.")
        
    # We only set blocked=True if we actually had flood polygons that we failed to avoid.
    is_blocked = len(all_floods) > 0
    candidates = process_valhalla_response(data, avoided_floods=False, blocked=is_blocked)
    return {"routes": candidates, "recommended_index": 0}
