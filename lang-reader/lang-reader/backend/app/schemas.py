"""
schemas.py — Pydantic 请求 / 响应模型
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


# ── 生词本 ──────────────────────────────────────────────────

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
    id:               int
    word:             str
    phonetic:         Optional[str]
    definitions:      List[Definition]
    status:           str
    ease_factor:      float
    interval_days:    int
    repetitions:      int
    next_review_at:   Optional[datetime]
    added_at:         datetime
    reviewed_at:      Optional[datetime]

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


class StatusUpdate(BaseModel):
    status: str

    @field_validator("status")
    @classmethod
    def check_status(cls, v: str) -> str:
        if v not in ("new", "fuzzy", "known"):
            raise ValueError("status must be one of: new, fuzzy, known")
        return v


# ── 复习记录 ────────────────────────────────────────────────

class ReviewLogOut(BaseModel):
    id:                   int
    word:                 str
    result:               str
    reviewed_at:          datetime
    ease_factor_before:   Optional[float]
    ease_factor_after:    Optional[float]
    interval_days_before: Optional[int]
    interval_days_after:  Optional[int]

    model_config = {"from_attributes": True}


# ── 通用响应 ────────────────────────────────────────────────

class MessageOut(BaseModel):
    message: str
