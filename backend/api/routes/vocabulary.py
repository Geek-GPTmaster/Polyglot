from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.language import Language
from models.vocabulary import Vocabulary
from schemas.vocabulary import VocabularyCreate, VocabularyRead, VocabularyUpdate
from services.dictionary import lookup_word

router = APIRouter(prefix="/api/vocabulary", tags=["vocabulary"])


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

async def _validate_language_code(db: AsyncSession, code: str) -> None:
    result = await db.execute(select(Language.code).where(Language.code == code))
    if result.scalar() is None:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail=f"Language code '{code}' not found.",
        )


async def _get_vocab_or_404(db: AsyncSession, vocab_id: int) -> Vocabulary:
    stmt = (
        select(Vocabulary)
        .where(Vocabulary.id == vocab_id)
        .options(selectinload(Vocabulary.tag))
    )
    result = await db.execute(stmt)
    vocab = result.scalar_one_or_none()
    if vocab is None:
        raise HTTPException(status_code=404, detail="Vocabulary entry not found")
    return vocab


# ---------------------------------------------------------------------------
# GET /api/vocabulary
# ---------------------------------------------------------------------------

@router.get("", response_model=list[VocabularyRead])
async def list_vocabulary(
    language: str,
    tag_id: int | None = None,
    search: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[VocabularyRead]:
    await _validate_language_code(db, language)

    stmt = (
        select(Vocabulary)
        .where(Vocabulary.language_code == language)
        .options(selectinload(Vocabulary.tag))
        .order_by(Vocabulary.created_at.desc())
    )
    if tag_id is not None:
        stmt = stmt.where(Vocabulary.tag_id == tag_id)
    if search:
        stmt = stmt.where(Vocabulary.word.ilike(f"{search}%"))

    result = await db.execute(stmt)
    return result.scalars().all()


# ---------------------------------------------------------------------------
# POST /api/vocabulary
# ---------------------------------------------------------------------------

@router.post("", status_code=201, response_model=VocabularyRead)
async def create_vocabulary(
    body: VocabularyCreate,
    db: AsyncSession = Depends(get_db),
) -> VocabularyRead:
    await _validate_language_code(db, body.language_code)

    # Check for duplicate (word, language_code)
    existing = await db.execute(
        select(Vocabulary).where(
            Vocabulary.word == body.word.lower(),
            Vocabulary.language_code == body.language_code,
        )
    )
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(
            status_code=409,
            detail=f"'{body.word}' already exists in {body.language_code} vocabulary.",
        )

    # Look up definition from dictionary service
    definition_data = await lookup_word(body.word, body.language_code, db)

    now = datetime.now(timezone.utc)
    vocab = Vocabulary(
        word=body.word.lower().strip(),
        language_code=body.language_code,
        definition=definition_data.definition if definition_data else None,
        phonetics=definition_data.phonetics if definition_data else None,
        part_of_speech=definition_data.part_of_speech if definition_data else None,
        example=definition_data.example if definition_data else None,
        source_article_id=body.source_article_id,
        next_review_at=now,
        created_at=now,
        updated_at=now,
    )
    db.add(vocab)
    await db.commit()

    # Reload with tag relationship
    return await _get_vocab_or_404(db, vocab.id)


# ---------------------------------------------------------------------------
# PATCH /api/vocabulary/{id}
# ---------------------------------------------------------------------------

@router.patch("/{vocab_id}", response_model=VocabularyRead)
async def update_vocabulary(
    vocab_id: int,
    body: VocabularyUpdate,
    db: AsyncSession = Depends(get_db),
) -> VocabularyRead:
    vocab = await _get_vocab_or_404(db, vocab_id)

    if body.notes is not None:
        vocab.notes = body.notes
    if body.tag_id is not None:
        vocab.tag_id = body.tag_id
    elif "tag_id" in body.model_fields_set and body.tag_id is None:
        vocab.tag_id = None  # explicit null clears the tag

    vocab.updated_at = datetime.now(timezone.utc)
    await db.commit()

    return await _get_vocab_or_404(db, vocab_id)


# ---------------------------------------------------------------------------
# DELETE /api/vocabulary/{id}
# ---------------------------------------------------------------------------

@router.delete("/{vocab_id}", status_code=204)
async def delete_vocabulary(
    vocab_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    vocab = await _get_vocab_or_404(db, vocab_id)
    await db.delete(vocab)
    await db.commit()
