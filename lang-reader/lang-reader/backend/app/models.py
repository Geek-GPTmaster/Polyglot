"""
models.py — SQLAlchemy ORM 数据模型
四张表：articles / word_definitions / vocabulary / review_logs
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.database import Base


class Article(Base):
    __tablename__ = "articles"

    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String(200), nullable=False)
    content    = Column(Text, nullable=False)
    word_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WordDefinition(Base):
    """词典缓存：同一个词只查一次外部 API"""
    __tablename__ = "word_definitions"

    id          = Column(Integer, primary_key=True, index=True)
    word        = Column(String(100), unique=True, nullable=False, index=True)
    phonetic    = Column(String(100))
    definitions = Column(Text, nullable=False)
    updated_at  = Column(DateTime(timezone=True), server_default=func.now())


class Vocabulary(Base):
    """生词本：用户收藏的单词"""
    __tablename__ = "vocabulary"

    id          = Column(Integer, primary_key=True, index=True)
    word        = Column(String(100), unique=True, nullable=False, index=True)
    phonetic    = Column(String(100))
    definitions = Column(Text, nullable=False)
    status      = Column(String(20), default="new")      # new | fuzzy | known

    # ── 间隔复习预留字段（SM-2 算法所需）────────────────────
    ease_factor    = Column(Float, default=2.5)           # 难度系数，初始 2.5
    interval_days  = Column(Integer, default=1)           # 下次复习间隔（天）
    repetitions    = Column(Integer, default=0)           # 连续答对次数
    next_review_at = Column(DateTime(timezone=True), nullable=True)  # 下次复习时间
    # ────────────────────────────────────────────────────────

    article_id  = Column(Integer, ForeignKey("articles.id"), nullable=True)
    added_at    = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)   # 最近一次复习时间


class ReviewLog(Base):
    """
    复习记录表：每次用户做出判断都写一条日志
    为间隔复习算法提供历史数据
    """
    __tablename__ = "review_logs"

    id          = Column(Integer, primary_key=True, index=True)
    word        = Column(String(100), nullable=False, index=True)
    result      = Column(String(20), nullable=False)     # known | fuzzy | new
    reviewed_at = Column(DateTime(timezone=True), server_default=func.now())

    # ── 间隔复习预留字段 ─────────────────────────────────────
    ease_factor_before   = Column(Float, nullable=True)  # 复习前的 ease_factor
    ease_factor_after    = Column(Float, nullable=True)  # 复习后的 ease_factor
    interval_days_before = Column(Integer, nullable=True)
    interval_days_after  = Column(Integer, nullable=True)
    # ────────────────────────────────────────────────────────
