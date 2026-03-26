from datetime import datetime
from pydantic import BaseModel


class TagRead(BaseModel):
    id: int
    name: str
    created_at: datetime

    model_config = {"from_attributes": True}


class TagCreate(BaseModel):
    name: str


class TagUpdate(BaseModel):
    name: str
