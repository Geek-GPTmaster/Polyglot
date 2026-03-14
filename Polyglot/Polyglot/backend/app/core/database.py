"""
core/database.py — 数据库引擎 + Session + 建表
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
from app.core.config import get_settings

settings = get_settings()

engine = create_engine(
    settings.get_database_url(),
    connect_args={"check_same_thread": False},   # SQLite 专用
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

Base = declarative_base()


def get_db():
    """FastAPI 依赖注入：提供 Session，用完自动关闭"""
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    """启动时调用，自动建表（幂等）"""
    from app.models import vocabulary, review_log  # noqa: F401
    Base.metadata.create_all(bind=engine)
