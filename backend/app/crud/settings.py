from sqlalchemy.orm import Session
from typing import Dict, Any
from app.models.setting import SystemSetting

DEFAULT_SETTINGS = {
    "flood_zone_expiry_hours": 24,
    "min_location_confidence": 0.6,
    "min_severity_confidence": 0.5,
    "auto_approve_threshold": 0.9
}

def get_all_settings(db: Session) -> Dict[str, Any]:
    """Retrieves all settings as a simple key-value dictionary, seeded with defaults if missing."""
    settings_db = db.query(SystemSetting).all()
    settings_dict = {s.key: s.value for s in settings_db}
    
    # Merge defaults for any missing keys
    merged_settings = DEFAULT_SETTINGS.copy()
    merged_settings.update(settings_dict)
    
    return merged_settings

def update_settings(db: Session, updates: Dict[str, Any], admin_id: int) -> Dict[str, Any]:
    """Bulk updates system settings and returns the fully merged set."""
    for key, value in updates.items():
        setting = db.query(SystemSetting).filter(SystemSetting.key == key).first()
        if setting:
            setting.value = value
            setting.last_updated_by = admin_id
        else:
            setting = SystemSetting(key=key, value=value, last_updated_by=admin_id)
            db.add(setting)
            
    db.commit()
    return get_all_settings(db)
