from datetime import datetime, timedelta, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.app_settings import AppSetting
from models.language import Language
from models.review_log import ReviewLog
from models.vocabulary import Vocabulary
from schemas.vocabulary import ReviewCardRead

router = APIRouter(prefix="/api/review", tags=["review"])


class ReviewResultRequest(BaseModel):
    result: str  # "known" | "unknown"


class ReviewResultResponse(BaseModel):
    id: int
    next_review_at: datetime
    interval_days: int
    repetitions: int


class ReviewDueResponse(BaseModel):
    count: int
    daily_limit: int
    language_code: str
    cards: list[ReviewCardRead]


async def _validate_language_code(db: AsyncSession, code: str) -> None:
    result = await db.execute(select(Language.code).where(Language.code == code))
    if result.scalar() is None:
        raise HTTPException(status_code=422, detail=f"Language code '{code}' not found.")


async def _get_daily_limit(db: AsyncSession) -> int:
    row = await db.get(AppSetting, "daily_review_limit")
    try:
        return int(row.value) if row else 20
    except (ValueError, AttributeError):
        return 20


# ---------------------------------------------------------------------------
# GET /api/review/due
# ---------------------------------------------------------------------------

@router.get("/due", response_model=ReviewDueResponse)
async def get_due_cards(
    language: str,
    db: AsyncSession = Depends(get_db),
) -> ReviewDueResponse:
    await _validate_language_code(db, language)

    daily_limit = await _get_daily_limit(db)
    now = datetime.now(timezone.utc)

    stmt = (
        select(Vocabulary)
        .where(
            Vocabulary.language_code == language,
            Vocabulary.next_review_at <= now,
        )
        .order_by(Vocabulary.next_review_at.asc())
        .limit(daily_limit)
    )
    result = await db.execute(stmt)
    cards = result.scalars().all()

    return ReviewDueResponse(
        count=len(cards),
        daily_limit=daily_limit,
        language_code=language,
        cards=cards,
    )


# ---------------------------------------------------------------------------
# POST /api/review/{vocabulary_id}/result
# ---------------------------------------------------------------------------

@router.post("/{vocabulary_id}/result", response_model=ReviewResultResponse)
async def record_result(
    vocabulary_id: int,
    body: ReviewResultRequest,
    db: AsyncSession = Depends(get_db),
) -> ReviewResultResponse:
    if body.result not in ("known", "unknown"):
        raise HTTPException(status_code=422, detail="result must be 'known' or 'unknown'")

    vocab = await db.get(Vocabulary, vocabulary_id)
    if vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary entry not found")

    now = datetime.now(timezone.utc)

    if body.result == "known":
        if vocab.repetitions == 0:
            vocab.interval_days = 3
        else:
            vocab.interval_days = min(vocab.interval_days * 2, 30)
        vocab.repetitions += 1
        vocab.next_review_at = now + timedelta(days=vocab.interval_days)
    else:  # unknown
        vocab.interval_days = 1
        vocab.repetitions = 0
        # next_review_at = start of tomorrow
        tomorrow = (now + timedelta(days=1)).replace(
            hour=0, minute=0, second=0, microsecond=0
        )
        vocab.next_review_at = tomorrow

    vocab.updated_at = now

    log = ReviewLog(
        vocabulary_id=vocabulary_id,
        result=body.result,
        reviewed_at=now,
    )
    db.add(log)
    await db.commit()
    await db.refresh(vocab)

    return ReviewResultResponse(
        id=vocab.id,
        next_review_at=vocab.next_review_at,
        interval_days=vocab.interval_days,
        repetitions=vocab.repetitions,
    )
