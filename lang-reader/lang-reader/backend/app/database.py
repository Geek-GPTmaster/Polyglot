"""
database.py — 数据库连接与初始化
"""
from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker
import os

BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DATA_DIR = os.path.join(BASE_DIR, "data")
os.makedirs(DATA_DIR, exist_ok=True)          # 确保 data/ 目录存在

DATABASE_URL = f"sqlite:///{os.path.join(DATA_DIR, 'lang_reader.db')}"

engine = create_engine(
    DATABASE_URL,
    connect_args={"check_same_thread": False},
)

SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


def init_db():
    from app import models  # noqa: F401 — 让 Base 感知所有 model
    Base.metadata.create_all(bind=engine)
