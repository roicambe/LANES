from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, schemas
from app.core.database import get_db

router = APIRouter()


@router.post("", response_model=schemas.FloodReportResponse, status_code=status.HTTP_201_CREATED)
def create_report(report: schemas.FloodReportCreate, db: Session = Depends(get_db)):
    """
    Submit a new flood report (raw Taglish text and optional coordinates).
    """
    return crud.create_flood_report(db=db, report=report)


@router.get("", response_model=List[schemas.FloodReportResponse])
def read_reports(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    """
    Retrieve list of flood reports (paginated).
    """
    try:
        return crud.get_flood_reports(db=db, skip=skip, limit=limit)
    except Exception as e:
        print(f"Warning: Database is offline ({e}). Returning empty list for reports.")
        return []


@router.get("/active-zones", response_model=List[schemas.FloodAvoidanceZoneResponse])
def read_active_avoidance_zones(db: Session = Depends(get_db)):
    """
    Retrieve all active flood avoidance zones (polygons representing detour zones).
    """
    try:
        return crud.get_active_avoidance_zones(db=db)
    except Exception as e:
        print(f"Warning: Database is offline ({e}). Returning empty list for active zones.")
        return []


@router.post("/avoidance-zones", response_model=schemas.FloodAvoidanceZoneResponse, status_code=status.HTTP_201_CREATED)
def create_avoidance_zone(zone: schemas.FloodAvoidanceZoneCreate, db: Session = Depends(get_db)):
    """
    Create a new flood avoidance zone (polygonal boundary coordinates associated with a report).
    """
    # Verify that the report exists
    report = crud.get_flood_report(db=db, report_id=zone.report_id)
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Flood report with ID {zone.report_id} not found"
        )
    return crud.create_flood_avoidance_zone(db=db, zone=zone)


from app.services.routing import calculate_flood_safe_route

@router.post("/route", response_model=schemas.RouteResponse)
def get_safe_route(payload: schemas.RouteRequest, db: Session = Depends(get_db)):
    """
    Calculate a driving route from start to end coordinates that avoids active flood zones.
    Fallback to standard route if all options are blocked.
    """
    return calculate_flood_safe_route(db=db, start=payload.start, end=payload.end)

