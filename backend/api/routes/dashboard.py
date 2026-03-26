from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.article import Article
from models.language import Language
from models.review_log import ReviewLog
from models.vocabulary import Vocabulary

router = APIRouter(prefix="/api/dashboard", tags=["dashboard"])


class RecentArticle(BaseModel):
    id: int
    title: str
    language_code: str
    last_read_at: datetime | None

    model_config = {"from_attributes": True}


class DashboardResponse(BaseModel):
    language_code: str
    total_articles: int
    total_vocabulary: int
    due_today: int
    reviewed_today: int
    recent_articles: list[RecentArticle]


async def _validate_language_code(db: AsyncSession, code: str) -> None:
    result = await db.execute(select(Language.code).where(Language.code == code))
    if result.scalar() is None:
        raise HTTPException(status_code=422, detail=f"Language code '{code}' not found.")


# ---------------------------------------------------------------------------
# GET /api/dashboard
# ---------------------------------------------------------------------------

@router.get("", response_model=DashboardResponse)
async def get_dashboard(
    language: str,
    db: AsyncSession = Depends(get_db),
) -> DashboardResponse:
    await _validate_language_code(db, language)

    now = datetime.now(timezone.utc)
    today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)

    # total_articles
    total_articles_result = await db.execute(
        select(func.count(Article.id)).where(Article.language_code == language)
    )
    total_articles = total_articles_result.scalar() or 0

    # total_vocabulary
    total_vocab_result = await db.execute(
        select(func.count(Vocabulary.id)).where(Vocabulary.language_code == language)
    )
    total_vocabulary = total_vocab_result.scalar() or 0

    # due_today: next_review_at <= now
    due_result = await db.execute(
        select(func.count(Vocabulary.id)).where(
            Vocabulary.language_code == language,
            Vocabulary.next_review_at <= now,
        )
    )
    due_today = due_result.scalar() or 0

    # reviewed_today: review_logs joined to vocabulary where reviewed_at >= today_start
    reviewed_result = await db.execute(
        select(func.count(ReviewLog.id))
        .join(Vocabulary, ReviewLog.vocabulary_id == Vocabulary.id)
        .where(
            Vocabulary.language_code == language,
            ReviewLog.reviewed_at >= today_start,
        )
    )
    reviewed_today = reviewed_result.scalar() or 0

    # recent_articles: last 5 by last_read_at (non-null), then created_at
    recent_result = await db.execute(
        select(Article)
        .where(Article.language_code == language)
        .order_by(Article.last_read_at.desc().nulls_last(), Article.created_at.desc())
        .limit(5)
    )
    recent_articles = recent_result.scalars().all()

    return DashboardResponse(
        language_code=language,
        total_articles=total_articles,
        total_vocabulary=total_vocabulary,
        due_today=due_today,
        reviewed_today=reviewed_today,
        recent_articles=recent_articles,
    )
