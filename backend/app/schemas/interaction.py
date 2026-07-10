from datetime import datetime
from typing import Optional
from pydantic import BaseModel, ConfigDict


class PostInteractionBase(BaseModel):
    report_id: int
    interaction_type: str


class PostInteractionCreate(PostInteractionBase):
    pass


class PostInteractionInDBBase(PostInteractionBase):
    id: int
    user_id: int
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)


class PostInteraction(PostInteractionInDBBase):
    pass
