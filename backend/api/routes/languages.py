from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.language import Language
from schemas.language import LanguageRead

router = APIRouter(prefix="/api/languages", tags=["languages"])


@router.get("", response_model=list[LanguageRead])
async def get_languages(
    all: bool = False,
    db: AsyncSession = Depends(get_db),
) -> list[LanguageRead]:
    """Return languages. By default only active ones; pass ?all=true for all."""
    stmt = select(Language)
    if not all:
        stmt = stmt.where(Language.is_active.is_(True))
    stmt = stmt.order_by(Language.code)
    result = await db.execute(stmt)
    return result.scalars().all()
