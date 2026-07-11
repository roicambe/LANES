from sqlalchemy.orm import Session
from sqlalchemy import func, case, text, Float, String
from app.models.report import FloodReport
from app.models.interaction import PostInteraction
from typing import Optional

def get_feed_posts(
    db: Session,
    user_id: Optional[int] = None,
    lat: Optional[float] = None,
    lng: Optional[float] = None,
    radius: Optional[float] = None,
    skip: int = 0,
    limit: int = 20,
    tab: str = "recent"
):
    # Base query for active, approved, and public reports
    base_query = db.query(FloodReport).filter(
        FloodReport.status == "approved",
        FloodReport.is_public == True,
        FloodReport.deleted_at.is_(None)
    )

    from app.models.user import User
    from app.models.comment import Comment

    # Subqueries for upvotes and downvotes
    upvotes_query = db.query(
        PostInteraction.report_id,
        func.count(PostInteraction.id).label("upvotes")
    ).filter(PostInteraction.interaction_type == "upvote").group_by(PostInteraction.report_id).subquery()

    downvotes_query = db.query(
        PostInteraction.report_id,
        func.count(PostInteraction.id).label("downvotes")
    ).filter(PostInteraction.interaction_type == "downvote").group_by(PostInteraction.report_id).subquery()

    # Subquery for comments
    comments_query = db.query(
        Comment.report_id,
        func.count(Comment.id).label("comment_count")
    ).group_by(Comment.report_id).subquery()

    # Subquery for current user interaction if user_id is provided
    user_interaction_sq = None
    if user_id:
        user_interaction_sq = db.query(
            PostInteraction.report_id,
            PostInteraction.interaction_type.label("user_interaction")
        ).filter(PostInteraction.user_id == user_id).subquery()

    # Build the main select fields
    select_fields = [
        FloodReport,
        func.coalesce(upvotes_query.c.upvotes, 0).label("upvotes"),
        func.coalesce(downvotes_query.c.downvotes, 0).label("downvotes"),
        func.coalesce(User.username, text("'External Source'")).label("author_name"),
        func.coalesce(comments_query.c.comment_count, 0).label("comment_count"),
    ]

    # Distance calculation if lat/lng are provided
    distance_col = None
    if lat is not None and lng is not None:
        # Create a PostGIS point for the user location
        user_pt = func.ST_SetSRID(func.ST_MakePoint(lng, lat), 4326)
        
        # Calculate distance in meters using Geography casting
        distance_col = func.ST_Distance(
            func.cast(FloodReport.geometry, text("GEOGRAPHY")),
            func.cast(user_pt, text("GEOGRAPHY"))
        ).label("distance_meters")
        select_fields.append(distance_col)

        if radius is not None:
            # Filter reports within the radius
            base_query = base_query.filter(
                func.ST_DWithin(
                    func.cast(FloodReport.geometry, text("GEOGRAPHY")),
                    func.cast(user_pt, text("GEOGRAPHY")),
                    radius
                )
            )
    else:
        # Placeholder for distance if no location is given
        select_fields.append(func.cast(None, Float).label("distance_meters"))

    if user_interaction_sq is not None:
        select_fields.append(user_interaction_sq.c.user_interaction)
    else:
        select_fields.append(func.cast(None, String).label("user_interaction"))

    # Join the subqueries
    query = base_query.with_entities(*select_fields)
    query = query.outerjoin(User, FloodReport.user_id == User.id)
    query = query.outerjoin(upvotes_query, FloodReport.id == upvotes_query.c.report_id)
    query = query.outerjoin(downvotes_query, FloodReport.id == downvotes_query.c.report_id)
    query = query.outerjoin(comments_query, FloodReport.id == comments_query.c.report_id)
    if user_interaction_sq is not None:
        query = query.outerjoin(user_interaction_sq, FloodReport.id == user_interaction_sq.c.report_id)

    # Ordering
    if tab == "nearby" and distance_col is not None:
        query = query.order_by(distance_col.asc(), FloodReport.created_at.desc())
    else:
        # Default to recent
        query = query.order_by(FloodReport.created_at.desc())

    total = base_query.count()
    results = query.offset(skip).limit(limit).all()
    
    has_more = (skip + limit) < total

    # Format the results to match FeedPostResponse
    posts = []
    for row in results:
        # Access elements by index or name
        report = row[0]
        upvotes = row[1]
        downvotes = row[2]
        author_name = row[3]
        comment_count = row[4]
        dist = row[5]
        u_int = row[6]
        
        # Convert ORM model to dictionary and add extra fields
        post_data = {
            **report.__dict__,
            "upvotes": upvotes,
            "downvotes": downvotes,
            "distance_meters": dist,
            "user_interaction": u_int,
            "author_name": author_name,
            "comment_count": comment_count
        }
        posts.append(post_data)

    return {
        "posts": posts,
        "total": total,
        "has_more": has_more
    }
