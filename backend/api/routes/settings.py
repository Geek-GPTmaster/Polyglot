from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.app_settings import AppSetting

router = APIRouter(prefix="/api/settings", tags=["settings"])


# ---------------------------------------------------------------------------
# GET /api/settings
# ---------------------------------------------------------------------------

@router.get("", response_model=dict[str, str])
async def get_settings(db: AsyncSession = Depends(get_db)) -> dict[str, str]:
    result = await db.execute(select(AppSetting))
    return {row.key: row.value for row in result.scalars().all()}


# ---------------------------------------------------------------------------
# PATCH /api/settings
# ---------------------------------------------------------------------------

@router.patch("", response_model=dict[str, str])
async def update_settings(
    updates: dict[str, str],
    db: AsyncSession = Depends(get_db),
) -> dict[str, str]:
    for key, value in updates.items():
        row = await db.get(AppSetting, key)
        if row is None:
            row = AppSetting(key=key, value=value)
            db.add(row)
        else:
            row.value = value

    await db.commit()

    result = await db.execute(select(AppSetting))
    return {row.key: row.value for row in result.scalars().all()}
