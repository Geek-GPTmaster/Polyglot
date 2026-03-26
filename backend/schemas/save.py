from datetime import datetime
from pydantic import BaseModel


class SaveRead(BaseModel):
    id: int
    article_id: int
    article_title: str
    type: str
    saved_text: str
    note: str | None
    created_at: datetime

    model_config = {"from_attributes": True}


class SaveCreate(BaseModel):
    article_id: int
    type: str  # 'annotation' | 'quote'
    saved_text: str
    note: str | None = None
    char_start: int | None = None
    char_end: int | None = None
