from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.report import FloodReport
from app.models.comment import Comment
from pydantic import BaseModel, ConfigDict
from datetime import datetime

router = APIRouter()

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    author_name: str
    
    model_config = ConfigDict(from_attributes=True)

@router.get("/{report_id}/comments", response_model=List[CommentResponse])
def get_comments(report_id: int, db: Session = Depends(get_db)):
    # Verify report exists
    report = db.query(FloodReport).filter(FloodReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    comments = db.query(Comment).filter(Comment.report_id == report_id).order_by(Comment.created_at.asc()).all()
    
    # Map author name
    results = []
    for c in comments:
        results.append({
            "id": c.id,
            "content": c.content,
            "created_at": c.created_at,
            "author_name": c.user.username if c.user else "Unknown User"
        })
        
    return results

@router.post("/{report_id}/comments", response_model=CommentResponse)
def create_comment(
    report_id: int, 
    comment_in: CommentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify report exists
    report = db.query(FloodReport).filter(FloodReport.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
        
    db_comment = Comment(
        user_id=current_user.id,
        report_id=report_id,
        content=comment_in.content
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    return {
        "id": db_comment.id,
        "content": db_comment.content,
        "created_at": db_comment.created_at,
        "author_name": current_user.username
    }
