from datetime import datetime
from pydantic import BaseModel


class ArticleListRead(BaseModel):
    id: int
    title: str
    language_code: str
    word_count: int
    source_format: str
    created_at: datetime
    last_read_at: datetime | None

    model_config = {"from_attributes": True}


class ArticleRead(ArticleListRead):
    content: str
    scroll_position: int


class ArticleImportResponse(BaseModel):
    id: int
    title: str
    language_code: str
    word_count: int


class ScrollUpdateRequest(BaseModel):
    scroll_position: int
