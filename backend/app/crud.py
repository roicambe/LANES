import hashlib
from typing import List, Optional
from sqlalchemy.orm import Session
from sqlalchemy import func

from app import models, schemas


# ==========================================
# 1. Hashing Utilities
# ==========================================

def get_password_hash(password: str) -> str:
    """
    Zero-dependency password hashing using PBKDF2 with SHA-256 and a static salt.
    Note: For production grade deployments, use bcrypt/argon2 via passlib.
    """
    salt = b"lanes_secure_salt_value_commuter_drrm"
    iterations = 100000
    key = hashlib.pbkdf2_hmac("sha256", password.encode("utf-8"), salt, iterations)
    return key.hex()


# ==========================================
# 2. User CRUD Operations
# ==========================================

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()


def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()


def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()


def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    hashed_pass = get_password_hash(user.password)
    db_user = models.User(
        username=user.username,
        email=user.email,
        hashed_password=hashed_pass,
        role=user.role
    )
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user


# ==========================================
# 3. Flood Report CRUD Operations
# ==========================================

def get_flood_report(db: Session, report_id: int) -> Optional[models.FloodReport]:
    return db.query(models.FloodReport).filter(models.FloodReport.id == report_id).first()


def get_flood_reports(db: Session, skip: int = 0, limit: int = 100) -> List[models.FloodReport]:
    return db.query(models.FloodReport).offset(skip).limit(limit).all()


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


# ==========================================
# 4. Flood Avoidance Zone CRUD Operations
# ==========================================

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
