from datetime import datetime
from pydantic import BaseModel
from schemas.tag import TagRead


class VocabularyRead(BaseModel):
    id: int
    word: str
    language_code: str
    definition: str | None
    phonetics: str | None
    part_of_speech: str | None
    example: str | None
    notes: str | None
    tag: TagRead | None
    interval_days: int
    repetitions: int
    next_review_at: datetime
    created_at: datetime

    model_config = {"from_attributes": True}


class VocabularyCreate(BaseModel):
    word: str
    language_code: str
    source_article_id: int | None = None


class VocabularyUpdate(BaseModel):
    notes: str | None = None
    tag_id: int | None = None


class ReviewCardRead(BaseModel):
    id: int
    word: str
    language_code: str
    phonetics: str | None
    part_of_speech: str | None
    definition: str | None
    example: str | None
    repetitions: int
    interval_days: int

    model_config = {"from_attributes": True}
