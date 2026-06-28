# CRUD index
from app.crud.user import (
    get_password_hash, get_user, get_user_by_username, get_user_by_email, create_user
)
from app.crud.report import (
    get_flood_report, get_flood_reports, get_pending_flood_reports, 
    update_flood_report_status, create_flood_report,
    get_active_avoidance_zones, create_flood_avoidance_zone
)

# Route domain currently has no CRUD (mostly algorithmic), adding comment per user request
# from app.crud.route import ...
