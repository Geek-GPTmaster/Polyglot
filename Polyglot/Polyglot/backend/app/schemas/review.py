"""
schemas/review.py — 复习相关请求 / 响应模型
"""
from __future__ import annotations
from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ReviewRequest(BaseModel):
    """提交复习结果"""
    status: str

    @field_validator("status")
    @classmethod
    def check_status(cls, v: str) -> str:
        if v not in ("new", "fuzzy", "known"):
            raise ValueError("status must be: new | fuzzy | known")
        return v


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


class ReviewSummary(BaseModel):
    today_reviewed: int
    today_known:    int
    today_fuzzy:    int
    today_new:      int
    total_words:    int
    due_count:      int
