from pydantic import BaseModel, ConfigDict
from typing import Dict, Any, Optional

class SystemSettingsUpdate(BaseModel):
    settings: Dict[str, Any]

class SystemSettingResponse(BaseModel):
    key: str
    value: Any
    
    model_config = ConfigDict(from_attributes=True)
