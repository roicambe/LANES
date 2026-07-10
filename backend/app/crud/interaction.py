from sqlalchemy.orm import Session
from sqlalchemy import and_
from app.models.interaction import PostInteraction
from app.schemas.interaction import PostInteractionCreate

def get_interaction(db: Session, user_id: int, report_id: int):
    return db.query(PostInteraction).filter(
        and_(
            PostInteraction.user_id == user_id,
            PostInteraction.report_id == report_id
        )
    ).first()

def toggle_interaction(db: Session, user_id: int, interaction_in: PostInteractionCreate):
    existing = get_interaction(db, user_id, interaction_in.report_id)
    
    if existing:
        if existing.interaction_type == interaction_in.interaction_type:
            # Toggle off if it's the exact same type
            db.delete(existing)
            db.commit()
            return None
        else:
            # Switch interaction type (e.g. upvote to downvote)
            existing.interaction_type = interaction_in.interaction_type
            db.commit()
            db.refresh(existing)
            return existing
            
    # Create new
    db_obj = PostInteraction(
        user_id=user_id,
        report_id=interaction_in.report_id,
        interaction_type=interaction_in.interaction_type
    )
    db.add(db_obj)
    db.commit()
    db.refresh(db_obj)
    return db_obj
