"""
models/vocabulary.py — 生词本 ORM 模型
"""
from sqlalchemy import Column, Integer, String, Text, DateTime, ForeignKey, Float
from sqlalchemy.sql import func
from app.core.database import Base


class Article(Base):
    __tablename__ = "articles"

    id         = Column(Integer, primary_key=True, index=True)
    title      = Column(String(200), nullable=False)
    content    = Column(Text, nullable=False)
    word_count = Column(Integer)
    created_at = Column(DateTime(timezone=True), server_default=func.now())


class WordDefinition(Base):
    """词典查询缓存：同一单词只查一次外部 API"""
    __tablename__ = "word_definitions"

    id          = Column(Integer, primary_key=True, index=True)
    word        = Column(String(100), unique=True, nullable=False, index=True)
    phonetic    = Column(String(100))
    definitions = Column(Text, nullable=False)   # JSON 字符串
    updated_at  = Column(DateTime(timezone=True), server_default=func.now())


class Vocabulary(Base):
    """生词本：用户收藏的单词 + 间隔复习数据"""
    __tablename__ = "vocabulary"

    id          = Column(Integer, primary_key=True, index=True)
    word        = Column(String(100), unique=True, nullable=False, index=True)
    phonetic    = Column(String(100))
    definitions = Column(Text, nullable=False)   # JSON，冗余存储
    status      = Column(String(20), default="new")   # new | fuzzy | known

    # ── SRS 字段（间隔复习算法，SM-2 预留）────────────────
    ease_factor    = Column(Float,   default=2.5)   # 难度系数
    interval_days  = Column(Integer, default=1)     # 下次复习间隔（天）
    repetitions    = Column(Integer, default=0)     # 连续答对次数
    next_review_at = Column(DateTime(timezone=True), nullable=True)
    # ────────────────────────────────────────────────────

    article_id  = Column(Integer, ForeignKey("articles.id"), nullable=True)
    added_at    = Column(DateTime(timezone=True), server_default=func.now())
    reviewed_at = Column(DateTime(timezone=True), nullable=True)
