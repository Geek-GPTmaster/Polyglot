"""
models/review_log.py — 复习记录 ORM 模型
每次用户对单词做出判断，写一条日志
"""
from sqlalchemy import Column, Integer, String, DateTime, Float
from sqlalchemy.sql import func
from app.core.database import Base


class ReviewLog(Base):
    __tablename__ = "review_logs"

    id          = Column(Integer, primary_key=True, index=True)
    word        = Column(String(100), nullable=False, index=True)
    result      = Column(String(20),  nullable=False)   # known | fuzzy | new
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── SRS 快照：记录每次复习前后的算法状态 ──────────────
    ease_factor_before   = Column(Float,   nullable=True)
    ease_factor_after    = Column(Float,   nullable=True)
    interval_days_before = Column(Integer, nullable=True)
    interval_days_after  = Column(Integer, nullable=True)
    # ────────────────────────────────────────────────────
