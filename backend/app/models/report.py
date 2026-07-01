from datetime import datetime
from typing import List, Optional, Any
from sqlalchemy import String, Integer, Boolean, DateTime, ForeignKey, JSON
from sqlalchemy.orm import Mapped, mapped_column, relationship
from geoalchemy2 import Geometry

from app.core.database import Base


class FloodReport(Base):
    """
    FloodReport model representing incoming Taglish flood feeds or manual user alerts.
    """
    __tablename__ = "flood_reports"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    user_id: Mapped[Optional[int]] = mapped_column(
        ForeignKey("users.id", ondelete="SET NULL"),
        nullable=True,
        index=True
    )
    raw_text: Mapped[str] = mapped_column(String)
    source: Mapped[str] = mapped_column(String(50))  # e.g., 'twitter', 'facebook', 'user_report'
    source_url: Mapped[Optional[str]] = mapped_column(String(500), nullable=True)
    extracted_locations: Mapped[Optional[Any]] = mapped_column(JSON, nullable=True)  # List of locations
    severity: Mapped[str] = mapped_column(String(20))  # 'low', 'medium', 'high', 'extreme'
    status: Mapped[str] = mapped_column(String(20), default="pending")  # 'pending', 'approved', 'rejected'
    
    # PostGIS Geometry column for latitude/longitude points (SRID 4326 = WGS 84 coordinate system)
    geometry: Mapped[Any] = mapped_column(
        Geometry(geometry_type="POINT", srid=4326, spatial_index=True),
        nullable=True
    )

    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    # Relationships
    avoidance_zones: Mapped[List["FloodAvoidanceZone"]] = relationship(
        "FloodAvoidanceZone",
        back_populates="report",
        cascade="all, delete-orphan"
    )
    locations: Mapped[List["FloodReportLocation"]] = relationship(
        "FloodReportLocation",
        back_populates="report",
        cascade="all, delete-orphan"
    )


class FloodReportLocation(Base):
    """
    FloodReportLocation model storing extracted locations for 3NF normalization.
    """
    __tablename__ = "flood_report_locations"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("flood_reports.id", ondelete="CASCADE"), index=True)
    location_name: Mapped[str] = mapped_column(String(100), index=True)

    # Relationships
    report: Mapped["FloodReport"] = relationship("FloodReport", back_populates="locations")


class FloodAvoidanceZone(Base):
    """
    FloodAvoidanceZone model representing generated detour areas around flooded coordinates.
    """
    __tablename__ = "flood_avoidance_zones"

    id: Mapped[int] = mapped_column(Integer, primary_key=True, index=True)
    report_id: Mapped[int] = mapped_column(ForeignKey("flood_reports.id", ondelete="CASCADE"), index=True)
    
    # PostGIS Geometry column for polygonal boundaries representing avoidance buffer areas
    geometry: Mapped[Any] = mapped_column(
        Geometry(geometry_type="POLYGON", srid=4326, spatial_index=True),
        nullable=False
    )
    
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    created_at: Mapped[datetime] = mapped_column(DateTime, default=datetime.utcnow)
    expires_at: Mapped[Optional[datetime]] = mapped_column(DateTime, nullable=True)

    # Relationships
    report: Mapped["FloodReport"] = relationship("FloodReport", back_populates="avoidance_zones")
