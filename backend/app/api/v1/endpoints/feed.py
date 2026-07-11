from typing import Optional
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session
from app.core.database import get_db
from app.api.deps import get_current_user_optional, get_current_user
from app.models.user import User
from app.schemas.feed import FeedPaginatedResponse
from app.schemas.interaction import PostInteractionCreate, PostInteraction
from app.crud import feed as crud_feed
from app.crud import interaction as crud_interaction
from app.models.interaction import InteractionType

router = APIRouter()

@router.get("/", response_model=FeedPaginatedResponse)
def get_feed(
    lat: Optional[float] = Query(None, description="User's latitude"),
    lng: Optional[float] = Query(None, description="User's longitude"),
    radius: Optional[float] = Query(5000, description="Radius in meters for nearby filtering"),
    skip: int = Query(0, ge=0),
    limit: int = Query(20, ge=1, le=100),
    tab: str = Query("recent", regex="^(recent|nearby)$"),
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_current_user_optional)
):
    """
    Retrieve community feed.
    If tab='nearby', lat and lng are required.
    """
    if tab == "nearby" and (lat is None or lng is None):
        raise HTTPException(
            status_code=400, 
            detail="Latitude and longitude must be provided for 'nearby' feed."
        )

    user_id = current_user.id if current_user else None
    
    feed_data = crud_feed.get_feed_posts(
        db=db,
        user_id=user_id,
        lat=lat,
        lng=lng,
        radius=radius,
        skip=skip,
        limit=limit,
        tab=tab
    )
    
    return feed_data


@router.post("/{report_id}/vote", response_model=Optional[PostInteraction])
def vote_post(
    report_id: int,
    interaction_in: PostInteractionCreate,
    db: Session = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    """
    Upvote or downvote a feed post.
    If the exact same interaction is sent, it will toggle (remove) it.
    If a different interaction is sent (e.g. upvote when previously downvoted), it will swap.
    """
    if interaction_in.report_id != report_id:
        raise HTTPException(status_code=400, detail="Report ID mismatch")
        
    if interaction_in.interaction_type not in [InteractionType.UPVOTE, InteractionType.DOWNVOTE]:
        raise HTTPException(status_code=400, detail="Invalid interaction type")

    result = crud_interaction.toggle_interaction(
        db=db, 
        user_id=current_user.id, 
        interaction_in=interaction_in
    )
    
    # If toggled off, result is None. Return a dummy schema or handle 204 No Content.
    # We will return the result or raise a 204 equivalent, but for simplicity, 
    # we can return an empty object or a dummy response if None.
    # To keep response_model clean, if it was deleted, we can return the input with a null ID.
    if result is None:
        return None
    
    return result
