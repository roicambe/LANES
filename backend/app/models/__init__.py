# Domain models are imported here to allow convenient "from app.models import X"
from app.models.role import Role
from app.models.user import User
from app.models.profile import Profile
from app.models.address import Address
from app.models.otp import OTPVerification
from app.models.report import FloodReport, FloodAvoidanceZone, FloodReportLocation
from app.models.audit import AuditLog
from app.models.setting import SystemSetting
from app.models.interaction import PostInteraction

# Route domain currently has no models (mostly algorithmic), adding comment per user request
# from app.models.route import ...
