from typing import List, Any
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app import crud, models, schemas
from app.api import deps
from app.core.database import get_db

router = APIRouter()


@router.get("/reports/pending", response_model=List[schemas.FloodReportResponse])
def get_pending_reports(
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
    skip: int = 0,
    limit: int = 100,
) -> Any:
    """
    Retrieve all pending flood reports for moderation.
    Requires admin privileges.
    """
    return crud.get_pending_flood_reports(db=db, skip=skip, limit=limit)


@router.post("/reports/{report_id}/approve", response_model=schemas.FloodReportResponse)
def approve_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Approve a flood report. Automatically generates a FloodAvoidanceZone if the report has coordinates.
    Requires admin privileges.
    """
    report = crud.get_flood_report(db, report_id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.status == "approved":
        raise HTTPException(status_code=400, detail="Report is already approved")
    
    report = crud.update_flood_report_status(db, report_id=report_id, status="approved")

    # If the report has geometry, create an avoidance zone (simple 200m bounding box buffer)
    # The geometry field on the response schema will have the PointGeometry parsed from EWKB
    response_report = schemas.FloodReportResponse.model_validate(report)
    if response_report.geometry:
        lng, lat = response_report.geometry.coordinates
        radius = 0.002  # roughly 200m buffer
        polygon = schemas.PolygonGeometry(
            type="Polygon",
            coordinates=[[
                [lng - radius, lat - radius],
                [lng + radius, lat - radius],
                [lng + radius, lat + radius],
                [lng - radius, lat + radius],
                [lng - radius, lat - radius],
            ]]
        )
        zone_in = schemas.FloodAvoidanceZoneCreate(
            report_id=report.id,
            geometry=polygon,
            is_active=True
        )
        crud.create_flood_avoidance_zone(db, zone=zone_in)

    return report


@router.post("/reports/{report_id}/reject", response_model=schemas.FloodReportResponse)
def reject_report(
    report_id: int,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(deps.get_current_active_admin),
) -> Any:
    """
    Reject a flood report. 
    Requires admin privileges.
    """
    report = crud.get_flood_report(db, report_id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    
    return crud.update_flood_report_status(db, report_id=report_id, status="rejected")
