import json
from typing import Any, Dict, List
import httpx
from fastapi import HTTPException
from sqlalchemy import func
from sqlalchemy.orm import Session

from app import models
from app.core.config import settings


def get_osrm_routes(start: List[float], end: List[float]) -> Dict[str, Any]:
    """
    Queries the OSRM server for routes between start and end coordinates.
    Coordinates must be in format [longitude, latitude].
    Requests alternative routes by setting alternatives=true.
    """
    # OSRM expects coordinates in format {longitude},{latitude};{longitude},{latitude}
    url = f"{settings.OSRM_URL}/route/v1/driving/{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson&alternatives=true"
    
    try:
        response = httpx.get(url, timeout=10.0)
        if response.status_code == 200:
            return response.json()
        else:
            raise HTTPException(
                status_code=response.status_code,
                detail=f"OSRM server returned error: {response.text}"
            )
    except httpx.RequestError as exc:
        raise HTTPException(
            status_code=503,
            detail=f"Failed to communicate with OSRM routing server: {exc}"
        )


def check_route_intersection(db: Session, route_geojson: str) -> bool:
    """
    Uses PostGIS to check if the route line geometry intersects with any
    active and unexpired flood avoidance zone polygons in the database.
    """
    intersection_count = db.query(models.FloodAvoidanceZone).filter(
        models.FloodAvoidanceZone.is_active == True,
        (models.FloodAvoidanceZone.expires_at == None) | (models.FloodAvoidanceZone.expires_at > func.now()),
        func.ST_Intersects(
            models.FloodAvoidanceZone.geometry,
            func.ST_SetSRID(func.ST_GeomFromGeoJSON(route_geojson), 4326)
        )
    ).count()
    
    return intersection_count > 0


def calculate_flood_safe_route(db: Session, start: List[float], end: List[float], ignore_floods: bool = False) -> Dict[str, Any]:
    """
    Queries routes from OSRM and returns the first route alternative
    that does not cross any active flood avoidance zones.
    If all options cross flooded zones, or if ignore_floods is True, it falls back to the primary route.
    """
    data = get_osrm_routes(start, end)
    
    if not data.get("routes"):
        raise HTTPException(
            status_code=404,
            detail="No route options found by the pathfinding engine."
        )
        
    routes = data["routes"]
    
    if ignore_floods:
        primary_route = routes[0]
        return {
            "geometry": primary_route["geometry"],
            "distance": primary_route["distance"],
            "duration": primary_route["duration"],
            "avoided_floods": False,
            "blocked": False
        }
    
    # Check each route alternative
    db_offline = False
    for index, route in enumerate(routes):
        geometry_dict = route["geometry"]
        geojson_str = json.dumps(geometry_dict)
        
        try:
            # Check if the route geometry intersects any active flood zone
            is_blocked = check_route_intersection(db, geojson_str)
        except Exception as e:
            # Database is offline or query failed
            print(f"Warning: Database check failed ({e}). Bypassing flood avoidance validation...")
            db_offline = True
            break
        
        if not is_blocked:
            # Found a safe route option!
            # It avoided floods if the default (index 0) was blocked
            return {
                "geometry": geometry_dict,
                "distance": route["distance"],
                "duration": route["duration"],
                "avoided_floods": index > 0,
                "blocked": False
            }
            
    # Fallback: All routes intersect a flooded zone (or database was offline)
    primary_route = routes[0]
    return {
        "geometry": primary_route["geometry"],
        "distance": primary_route["distance"],
        "duration": primary_route["duration"],
        "avoided_floods": False,
        "blocked": not db_offline  # Only marked blocked if we successfully checked and all were blocked
    }

