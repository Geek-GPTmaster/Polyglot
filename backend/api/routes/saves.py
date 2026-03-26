from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.orm import selectinload
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.article import Article
from models.save import Save
from schemas.save import SaveCreate, SaveRead

router = APIRouter(prefix="/api/saves", tags=["saves"])

VALID_TYPES = {"annotation", "quote"}


def _to_save_read(save: Save) -> SaveRead:
    return SaveRead(
        id=save.id,
        article_id=save.article_id,
        article_title=save.article.title,
        type=save.type,
        saved_text=save.saved_text,
        note=save.note,
        created_at=save.created_at,
    )


# ---------------------------------------------------------------------------
# GET /api/saves
# ---------------------------------------------------------------------------

@router.get("", response_model=list[SaveRead])
async def list_saves(
    type: str | None = None,
    db: AsyncSession = Depends(get_db),
) -> list[SaveRead]:
    if type is not None and type not in VALID_TYPES:
        raise HTTPException(status_code=422, detail=f"type must be 'annotation' or 'quote'")

    stmt = (
        select(Save)
        .options(selectinload(Save.article))
        .order_by(Save.created_at.desc())
    )
    if type is not None:
        stmt = stmt.where(Save.type == type)

    result = await db.execute(stmt)
    saves = result.scalars().all()
    return [_to_save_read(s) for s in saves]


# ---------------------------------------------------------------------------
# POST /api/saves
# ---------------------------------------------------------------------------

@router.post("", status_code=201, response_model=SaveRead)
async def create_save(
    body: SaveCreate,
    db: AsyncSession = Depends(get_db),
) -> SaveRead:
    if body.type not in VALID_TYPES:
        raise HTTPException(status_code=422, detail="type must be 'annotation' or 'quote'")

    article = await db.get(Article, body.article_id)
    if article is None:
        raise HTTPException(status_code=404, detail="Article not found")

    save = Save(
        article_id=body.article_id,
        type=body.type,
        saved_text=body.saved_text,
        note=body.note,
        char_start=body.char_start,
        char_end=body.char_end,
        created_at=datetime.now(timezone.utc),
    )
    db.add(save)
    await db.commit()

    # Reload with article relationship
    stmt = (
        select(Save)
        .where(Save.id == save.id)
        .options(selectinload(Save.article))
    )
    result = await db.execute(stmt)
    save = result.scalar_one()
    return _to_save_read(save)


# ---------------------------------------------------------------------------
# DELETE /api/saves/{id}
# ---------------------------------------------------------------------------

@router.delete("/{save_id}", status_code=204)
async def delete_save(
    save_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    save = await db.get(Save, save_id)
    if save is None:
        raise HTTPException(status_code=404, detail="Save not found")
    await db.delete(save)
    await db.commit()
