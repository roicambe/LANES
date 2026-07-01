# CRUD index
from app.crud.user import (
    get_password_hash, get_user, get_user_by_username, get_user_by_email, create_user,
    get_users_filtered, update_user_status, delete_user
)
from app.crud.report import (
    get_flood_report, get_flood_reports, get_pending_flood_reports, 
    update_flood_report_status, create_flood_report,
    get_active_avoidance_zones, create_flood_avoidance_zone,
    get_all_flood_reports_filtered, get_admin_dashboard_stats,
    deactivate_flood_avoidance_zone, deactivate_flood_avoidance_zones_bulk,
    get_all_avoidance_zones_filtered
)

# Route domain currently has no CRUD (mostly algorithmic), adding comment per user request
# from app.crud.route import ...
from app.crud.audit import create_audit_log, get_audit_logs
