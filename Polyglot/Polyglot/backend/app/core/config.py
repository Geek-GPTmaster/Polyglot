"""
core/config.py — 应用配置（集中管理所有环境变量）
"""
from pydantic_settings import BaseSettings
from functools import lru_cache
import os


class Settings(BaseSettings):
    # ── 应用 ──────────────────────────────────────────────
    APP_NAME:    str = "Polyglot"
    APP_VERSION: str = "0.2.0"
    DEBUG:       bool = False

    # ── 数据库 ────────────────────────────────────────────
    DATABASE_URL: str = ""   # 留空则自动用 SQLite

    # ── CORS ─────────────────────────────────────────────
    CORS_ORIGINS: list[str] = ["http://localhost:3000"]

    # ── 词典 API（后续接入时填写）────────────────────────
    DICT_API_KEY: str = ""

    model_config = {"env_file": ".env", "env_file_encoding": "utf-8"}

    def get_database_url(self) -> str:
        if self.DATABASE_URL:
            return self.DATABASE_URL
        # 默认 SQLite，路径相对于 backend/
        base = os.path.dirname(os.path.dirname(os.path.dirname(
            os.path.abspath(__file__)
        )))
        data_dir = os.path.join(base, "data")
        os.makedirs(data_dir, exist_ok=True)
        return f"sqlite:///{os.path.join(data_dir, 'polyglot.db')}"


@lru_cache
def get_settings() -> Settings:
    return Settings()
