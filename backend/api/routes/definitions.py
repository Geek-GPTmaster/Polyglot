from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.language import Language
from schemas.word_definition import WordDefinitionRead
from services.dictionary import lookup_word
from sqlalchemy import select

router = APIRouter(prefix="/api/definitions", tags=["definitions"])


async def _validate_language_code(db: AsyncSession, code: str) -> None:
    result = await db.execute(select(Language.code).where(Language.code == code))
    if result.scalar() is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Language code '{code}' not found.",
        )


# ---------------------------------------------------------------------------
# GET /api/definitions/{word}
# ---------------------------------------------------------------------------

@router.get("/{word}", response_model=WordDefinitionRead)
async def get_definition(
    word: str,
    language: str,
    db: AsyncSession = Depends(get_db),
) -> WordDefinitionRead:
    await _validate_language_code(db, language)
    result = await lookup_word(word, language, db)
    if result is None:
        raise HTTPException(status_code=404, detail="Word not found")
    return result
