from pydantic import BaseModel
from typing import List, Optional
from datetime import datetime

class BackupFile(BaseModel):
    id: str
    name: str
    size_bytes: int
    created_at: datetime
    # created_by might be unknown if just a file, but we can set it to string
    created_by: Optional[str] = None

class RestoreRequest(BaseModel):
    confirm: bool

class CleanupRequest(BaseModel):
    date_from: datetime
    date_to: datetime
    confirm: bool

class ExportResponse(BaseModel):
    message: str
    file_path: str
