import sys
import os
import json
import httpx

sys.path.append(os.path.abspath(os.path.dirname(__file__)))

from sqlalchemy import text, func
from app.core.database import SessionLocal
from app.core.config import settings
from app import models

def seed_palatiw():
    start = [121.08493, 14.56382]
    end = [121.08729, 14.56417]
    
    print(f"Querying OSRM route from {start} to {end}...")
    url = f"{settings.OSRM_URL}/route/v1/driving/{start[0]},{start[1]};{end[0]},{end[1]}?overview=full&geometries=geojson"
    try:
        response = httpx.get(url, timeout=10.0)
        response.raise_for_status()
        data = response.json()
    except Exception as e:
        print(f"Error querying OSRM: {e}")
        # Fallback to a straight line if OSRM is offline
        data = {
            "routes": [
                {
                    "geometry": {
                        "type": "LineString",
                        "coordinates": [start, end]
                    }
                }
            ]
        }
        
    route_geom = data["routes"][0]["geometry"]
    print("Fetched OSRM route geometry:", route_geom)
    
    db = SessionLocal()
    try:
        print("Inserting approved flood report for Palatiw segment...")
        
        geojson_str = json.dumps(route_geom)
        geometry_clause = func.ST_SetSRID(func.ST_GeomFromGeoJSON(geojson_str), 4326)
        
        db_report = models.FloodReport(
            raw_text="Manual flood report for street segment in Barangay Palatiw, Pasig City.",
            source="manual_seeder",
            severity="high", # Orange (Hazardous, blocked in OSRM)
            status="approved",
            geometry=geometry_clause
        )
        db.add(db_report)
        db.commit()
        db.refresh(db_report)
        print(f"Report inserted with ID: {db_report.id}")
        
        # Calculate the 15-meter buffer polygon via PostGIS ST_Buffer
        buffer_radius = 0.00015 # ~15m
        buffered_geojson_str = db.query(
            func.ST_AsGeoJSON(func.ST_Buffer(db_report.geometry, buffer_radius))
        ).scalar()
        
        if buffered_geojson_str:
            buffer_polygon = func.ST_SetSRID(func.ST_GeomFromGeoJSON(buffered_geojson_str), 4326)
            db_zone = models.FloodAvoidanceZone(
                report_id=db_report.id,
                geometry=buffer_polygon,
                is_active=True
            )
            db.add(db_zone)
            
            # Also add location to flood_report_locations (3NF table)
            db_loc = models.FloodReportLocation(
                report_id=db_report.id,
                location_name="Barangay Palatiw"
            )
            db.add(db_loc)
            
            db.commit()
            print("Flood avoidance zone and normalized location created successfully!")
            
    except Exception as e:
        db.rollback()
        print(f"Error during seeding: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    seed_palatiw()
