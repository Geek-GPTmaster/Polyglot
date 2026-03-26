from datetime import datetime, timezone

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile, status
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.article import Article
from models.language import Language
from schemas.article import ArticleImportResponse, ArticleListRead, ArticleRead, ScrollUpdateRequest
from services.file_parser import parse_file
from services.language_detector import detect_language

router = APIRouter(prefix="/api/articles", tags=["articles"])

SUPPORTED_FORMATS = {".txt", ".md", ".pdf", ".docx", ".epub"}


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _get_active_language_codes(db: AsyncSession) -> list[str]:
    result = await db.execute(select(Language.code).where(Language.is_active.is_(True)))
    return [row[0] for row in result.all()]


async def _validate_language_code(db: AsyncSession, code: str) -> None:
    """Raise 422 if language_code is not in the languages table."""
    result = await db.execute(select(Language.code).where(Language.code == code))
    if result.scalar() is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Language code '{code}' not found. Add it to the languages table first.",
        )


def _count_words(text: str) -> int:
    return len(text.split())


def _derive_title(filename: str | None, text: str) -> str:
    """Generate a title from filename or first line of content."""
    if filename:
        from pathlib import Path
        stem = Path(filename).stem.replace("_", " ").replace("-", " ").strip()
        if stem:
            return stem
    # Fall back: first non-empty line, truncated to 80 chars
    for line in text.splitlines():
        line = line.strip()
        if line:
            return line[:80]
    return "Untitled"


# ---------------------------------------------------------------------------
# GET /api/articles
# ---------------------------------------------------------------------------

@router.get("", response_model=list[ArticleListRead])
async def list_articles(
    language: str,
    db: AsyncSession = Depends(get_db),
) -> list[ArticleListRead]:
    await _validate_language_code(db, language)
    stmt = (
        select(Article)
        .where(Article.language_code == language)
        .order_by(Article.created_at.desc())
    )
    result = await db.execute(stmt)
    return result.scalars().all()


# ---------------------------------------------------------------------------
# GET /api/articles/{id}
# ---------------------------------------------------------------------------

@router.get("/{article_id}", response_model=ArticleRead)
async def get_article(
    article_id: int,
    db: AsyncSession = Depends(get_db),
) -> ArticleRead:
    article = await db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    # Update last_read_at
    article.last_read_at = datetime.now(timezone.utc)
    await db.commit()
    await db.refresh(article)
    return article


# ---------------------------------------------------------------------------
# POST /api/articles/import
# ---------------------------------------------------------------------------

@router.post("/import", status_code=201, response_model=ArticleImportResponse)
async def import_article(
    file: UploadFile | None = File(None),
    text: str | None = Form(None),
    title: str | None = Form(None),
    language: str | None = Form(None),
    db: AsyncSession = Depends(get_db),
) -> ArticleImportResponse:
    # At least one of file or text must be provided
    if file is None and not text:
        raise HTTPException(status_code=400, detail="Provide either 'file' or 'text'.")

    # Parse content
    if file is not None:
        filename = file.filename or "upload.txt"
        from pathlib import Path
        ext = Path(filename).suffix.lower()
        if ext not in SUPPORTED_FORMATS:
            raise HTTPException(
                status_code=422,
                detail=f"Unsupported file format '{ext}'. Supported: {', '.join(sorted(SUPPORTED_FORMATS))}",
            )
        try:
            raw_bytes = await file.read()
            content = await parse_file(filename, raw_bytes)
        except ValueError as exc:
            raise HTTPException(status_code=422, detail=str(exc)) from exc
        except RuntimeError as exc:
            raise HTTPException(status_code=500, detail=str(exc)) from exc
        source_format = ext.lstrip(".")
        derived_title = title or _derive_title(filename, content)
    else:
        content = text  # type: ignore[assignment]
        source_format = "paste"
        derived_title = title or _derive_title(None, content)

    # Detect or validate language
    if language:
        await _validate_language_code(db, language)
        language_code = language
    else:
        active_codes = await _get_active_language_codes(db)
        language_code = detect_language(content, active_codes)

    article = Article(
        title=derived_title,
        content=content,
        language_code=language_code,
        word_count=_count_words(content),
        source_format=source_format,
        created_at=datetime.now(timezone.utc),
    )
    db.add(article)
    await db.commit()
    await db.refresh(article)

    return ArticleImportResponse(
        id=article.id,
        title=article.title,
        language_code=article.language_code,
        word_count=article.word_count,
    )


# ---------------------------------------------------------------------------
# PATCH /api/articles/{id}/scroll
# ---------------------------------------------------------------------------

@router.patch("/{article_id}/scroll", status_code=200)
async def update_scroll(
    article_id: int,
    body: ScrollUpdateRequest,
    db: AsyncSession = Depends(get_db),
) -> dict:
    article = await db.get(Article, article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    article.scroll_position = body.scroll_position
    await db.commit()
    return {"ok": True}
