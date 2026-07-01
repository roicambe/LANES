# Domain models are imported here to allow convenient "from app.models import X"
from app.models.user import User
from app.models.report import FloodReport, FloodAvoidanceZone, FloodReportLocation
from app.models.audit import AuditLog

# Route domain currently has no models (mostly algorithmic), adding comment per user request
# from app.models.route import ...
