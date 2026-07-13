from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func
import datetime

from app.core.database import get_db
from app.models.report import FloodReport, ReportStatus
from app.models.audit import VisitorCount

router = APIRouter()

@router.get("/stats")
def get_public_stats(increment: bool = False, db: Session = Depends(get_db)):
    """
    Retrieve public statistics for the landing page.
    Includes daily verified flood reports and total site visitors.
    Accepts an 'increment' boolean to conditionally increment the visitor count.
    """
    # 1. Daily Verified Reports
    today = datetime.datetime.utcnow().date()
    daily_verified_reports = db.query(FloodReport).filter(
        FloodReport.status == ReportStatus.APPROVED,
        func.date(FloodReport.created_at) == today
    ).count()
    
    visitor_record = db.query(VisitorCount).first()
    if not visitor_record:
        visitor_record = VisitorCount(total_visitors=0)
        db.add(visitor_record)
        db.commit()
        db.refresh(visitor_record)
        
    # Increment visitor count ONLY if requested by the frontend
    if increment:
        visitor_record.total_visitors += 1
        db.commit()
        db.refresh(visitor_record)

    return {
        "daily_verified_reports": daily_verified_reports,
        "total_visitors": visitor_record.total_visitors
    }
