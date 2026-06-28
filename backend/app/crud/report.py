from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models, schemas


def get_flood_report(db: Session, report_id: int) -> Optional[models.FloodReport]:
    return db.query(models.FloodReport).filter(models.FloodReport.id == report_id).first()


def get_flood_reports(db: Session, skip: int = 0, limit: int = 100) -> List[models.FloodReport]:
    return db.query(models.FloodReport).offset(skip).limit(limit).all()


def get_pending_flood_reports(db: Session, skip: int = 0, limit: int = 100) -> List[models.FloodReport]:
    return db.query(models.FloodReport).filter(models.FloodReport.status == "pending").offset(skip).limit(limit).all()


def update_flood_report_status(db: Session, report_id: int, status: str) -> Optional[models.FloodReport]:
    report = get_flood_report(db, report_id)
    if report:
        report.status = status
        db.commit()
        db.refresh(report)
    return report


def create_flood_report(db: Session, report: schemas.FloodReportCreate) -> models.FloodReport:
    geometry_clause = None
    if report.geometry:
        # Convert Pydantic PointGeometry to GeoJSON string for direct PostGIS parsing
        geojson_str = report.geometry.model_dump_json()
        geometry_clause = func.ST_SetSRID(func.ST_GeomFromGeoJSON(geojson_str), 4326)

    db_report = models.FloodReport(
        raw_text=report.raw_text,
        source=report.source,
        severity=report.severity,
        geometry=geometry_clause
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


def get_active_avoidance_zones(db: Session) -> List[models.FloodAvoidanceZone]:
    """
    Selects all avoidance zones that are marked active and whose expiry dates
    are either null (infinite) or in the future.
    """
    return db.query(models.FloodAvoidanceZone).filter(
        models.FloodAvoidanceZone.is_active == True,
        (models.FloodAvoidanceZone.expires_at == None) | (models.FloodAvoidanceZone.expires_at > func.now())
    ).all()


def create_flood_avoidance_zone(db: Session, zone: schemas.FloodAvoidanceZoneCreate) -> models.FloodAvoidanceZone:
    # Convert Pydantic PolygonGeometry to GeoJSON string for direct PostGIS parsing
    geojson_str = zone.geometry.model_dump_json()
    geometry_clause = func.ST_SetSRID(func.ST_GeomFromGeoJSON(geojson_str), 4326)

    db_zone = models.FloodAvoidanceZone(
        report_id=zone.report_id,
        geometry=geometry_clause,
        is_active=zone.is_active,
        expires_at=zone.expires_at
    )
    db.add(db_zone)
    db.commit()
    db.refresh(db_zone)
    return db_zone
