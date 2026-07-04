import sys
import os
sys.path.append(os.getcwd())

from app.core.database import SessionLocal
from app.crud.report import get_active_avoidance_zones
from app.schemas.report import FloodAvoidanceZoneResponse

db = SessionLocal()
try:
    zones = get_active_avoidance_zones(db)
    print("Fetched zones successfully")
    # try converting using pydantic to see if it fails
    for z in zones:
        res = FloodAvoidanceZoneResponse.model_validate(z)
        print("Zone ID:", res.id)
except Exception as e:
    import traceback
    traceback.print_exc()
finally:
    db.close()
