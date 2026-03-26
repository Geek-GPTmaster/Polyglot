"""Seed initial data into the database.

Run after: alembic upgrade head
Usage:    python seed.py
"""
import asyncio
from sqlalchemy import text
from database import AsyncSessionLocal


LANGUAGES = [
    # Active — shown in NavBar switcher
    {"code": "en", "name": "English",    "native_name": "English",   "is_active": True},
    {"code": "es", "name": "Spanish",    "native_name": "Español",   "is_active": True},
    # Pre-seeded — hidden until enabled via UPDATE languages SET is_active=true WHERE code='fr'
    {"code": "fr", "name": "French",     "native_name": "Français",  "is_active": False},
    {"code": "de", "name": "German",     "native_name": "Deutsch",   "is_active": False},
    {"code": "zh", "name": "Chinese",    "native_name": "中文",       "is_active": False},
    {"code": "ja", "name": "Japanese",   "native_name": "日本語",     "is_active": False},
    {"code": "pt", "name": "Portuguese", "native_name": "Português", "is_active": False},
]

DEFAULT_TAGS = ["Important", "Hard", "Mastered", "Review Later"]

DEFAULT_SETTINGS = {
    "daily_review_limit": "20",
}


async def seed() -> None:
    async with AsyncSessionLocal() as session:
        # Seed languages (skip if already exist)
        for lang in LANGUAGES:
            result = await session.execute(
                text("SELECT code FROM languages WHERE code = :code"),
                {"code": lang["code"]},
            )
            if result.fetchone() is None:
                await session.execute(
                    text(
                        "INSERT INTO languages (code, name, native_name, is_active) "
                        "VALUES (:code, :name, :native_name, :is_active)"
                    ),
                    lang,
                )
                print(f"  Seeded language: {lang['code']} ({lang['name']})")

        # Seed default tags
        for tag_name in DEFAULT_TAGS:
            result = await session.execute(
                text("SELECT id FROM tags WHERE name = :name"),
                {"name": tag_name},
            )
            if result.fetchone() is None:
                await session.execute(
                    text("INSERT INTO tags (name) VALUES (:name)"),
                    {"name": tag_name},
                )
                print(f"  Seeded tag: {tag_name}")

        # Seed app settings
        for key, value in DEFAULT_SETTINGS.items():
            result = await session.execute(
                text("SELECT key FROM app_settings WHERE key = :key"),
                {"key": key},
            )
            if result.fetchone() is None:
                await session.execute(
                    text("INSERT INTO app_settings (key, value) VALUES (:key, :value)"),
                    {"key": key, "value": value},
                )
                print(f"  Seeded setting: {key} = {value}")

        await session.commit()
        print("Seed complete.")


if __name__ == "__main__":
    asyncio.run(seed())
