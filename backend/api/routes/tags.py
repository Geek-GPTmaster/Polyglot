from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.tag import Tag
from schemas.tag import TagCreate, TagRead, TagUpdate

router = APIRouter(prefix="/api/tags", tags=["tags"])


# ---------------------------------------------------------------------------
# GET /api/tags
# ---------------------------------------------------------------------------

@router.get("", response_model=list[TagRead])
async def list_tags(db: AsyncSession = Depends(get_db)) -> list[TagRead]:
    result = await db.execute(select(Tag).order_by(Tag.name))
    return result.scalars().all()


# ---------------------------------------------------------------------------
# POST /api/tags
# ---------------------------------------------------------------------------

@router.post("", status_code=201, response_model=TagRead)
async def create_tag(
    body: TagCreate,
    db: AsyncSession = Depends(get_db),
) -> TagRead:
    existing = await db.execute(select(Tag).where(Tag.name == body.name))
    if existing.scalar_one_or_none() is not None:
        raise HTTPException(status_code=409, detail=f"Tag '{body.name}' already exists.")

    tag = Tag(name=body.name)
    db.add(tag)
    await db.commit()
    await db.refresh(tag)
    return tag


# ---------------------------------------------------------------------------
# PATCH /api/tags/{id}
# ---------------------------------------------------------------------------

@router.patch("/{tag_id}", response_model=TagRead)
async def update_tag(
    tag_id: int,
    body: TagUpdate,
    db: AsyncSession = Depends(get_db),
) -> TagRead:
    tag = await db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")

    tag.name = body.name
    await db.commit()
    await db.refresh(tag)
    return tag


# ---------------------------------------------------------------------------
# DELETE /api/tags/{id}
# ---------------------------------------------------------------------------

@router.delete("/{tag_id}", status_code=204)
async def delete_tag(
    tag_id: int,
    db: AsyncSession = Depends(get_db),
) -> None:
    tag = await db.get(Tag, tag_id)
    if tag is None:
        raise HTTPException(status_code=404, detail="Tag not found")
    await db.delete(tag)
    await db.commit()
