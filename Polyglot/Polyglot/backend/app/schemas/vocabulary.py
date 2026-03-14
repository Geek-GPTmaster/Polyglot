"""
schemas/vocabulary.py — 生词本请求 / 响应模型
"""
from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional, List
from datetime import datetime
import json


class Definition(BaseModel):
    pos:     str
    meaning: str
    example: str


class VocabularyCreate(BaseModel):
    word:        str
    phonetic:    Optional[str] = None
    definitions: List[Definition]
    article_id:  Optional[int] = None

    @field_validator("word")
    @classmethod
    def lowercase_word(cls, v: str) -> str:
        return v.strip().lower()


class VocabularyOut(BaseModel):
    id:             int
    word:           str
    phonetic:       Optional[str]
    definitions:    List[Definition]
    status:         str
    ease_factor:    float
    interval_days:  int
    repetitions:    int
    next_review_at: Optional[datetime]
    added_at:       datetime
    reviewed_at:    Optional[datetime]

    model_config = {"from_attributes": True}

    @classmethod
    def from_orm_row(cls, row) -> "VocabularyOut":
        defs = json.loads(row.definitions) if isinstance(row.definitions, str) else row.definitions
        return cls(
            id=row.id,
            word=row.word,
            phonetic=row.phonetic,
            definitions=[Definition(**d) for d in defs],
            status=row.status,
            ease_factor=row.ease_factor or 2.5,
            interval_days=row.interval_days or 1,
            repetitions=row.repetitions or 0,
            next_review_at=row.next_review_at,
            added_at=row.added_at,
            reviewed_at=row.reviewed_at,
        )


class MessageOut(BaseModel):
    message: str
