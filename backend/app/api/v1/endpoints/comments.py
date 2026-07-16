from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from app.core.database import get_db
from app.api.deps import get_current_user
from app.models.user import User
from app.models.post import CommunityPost
from app.models.comment import Comment
from pydantic import BaseModel, ConfigDict
from datetime import datetime
from app.models.notification import NotificationType
from app.schemas.notification import NotificationCreate
from app.crud import notification as crud_notification

router = APIRouter()

class CommentCreate(BaseModel):
    content: str

class CommentResponse(BaseModel):
    id: int
    content: str
    created_at: datetime
    author_name: str
    
    model_config = ConfigDict(from_attributes=True)

@router.get("/{post_id}/comments", response_model=List[CommentResponse])
def get_comments(post_id: int, db: Session = Depends(get_db)):
    # Verify post exists
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    comments = db.query(Comment).filter(Comment.post_id == post_id).order_by(Comment.created_at.asc()).all()
    
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

@router.post("/{post_id}/comments", response_model=CommentResponse)
def create_comment(
    post_id: int, 
    comment_in: CommentCreate, 
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    # Verify post exists
    post = db.query(CommunityPost).filter(CommunityPost.id == post_id).first()
    if not post:
        raise HTTPException(status_code=404, detail="Post not found")
        
    db_comment = Comment(
        user_id=current_user.id,
        post_id=post_id,
        content=comment_in.content
    )
    
    db.add(db_comment)
    db.commit()
    db.refresh(db_comment)
    
    # Notify author
    if post.user_id != current_user.id:
        crud_notification.create_notification(db, NotificationCreate(
            user_id=post.user_id,
            type=NotificationType.COMMENT,
            message="Someone commented on your post.",
            payload={"post_id": post_id, "actor_id": current_user.id}
        ))
    
    return {
        "id": db_comment.id,
        "content": db_comment.content,
        "created_at": db_comment.created_at,
        "author_name": current_user.username
    }
