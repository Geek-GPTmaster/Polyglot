"""
api/routes/vocabulary.py — 生词本 CRUD

GET    /api/vocabulary                  列表（?status=new|fuzzy|known）
POST   /api/vocabulary                  新增（幂等）
DELETE /api/vocabulary/{word}           删除
PATCH  /api/vocabulary/{word}/status    更新状态
"""
from __future__ import annotations
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.vocabulary import Vocabulary
from app.schemas.vocabulary import VocabularyCreate, VocabularyOut, MessageOut
from app.schemas.review import ReviewRequest

router = APIRouter()


@router.get("/", response_model=List[VocabularyOut])
def list_vocabulary(
    status: Optional[str] = Query(None, description="new | fuzzy | known"),
    db: Session = Depends(get_db),
):
    q = db.query(Vocabulary)
    if status:
        q = q.filter(Vocabulary.status == status)
    return [VocabularyOut.from_orm_row(r) for r in q.order_by(Vocabulary.added_at.desc())]


@router.post("/", response_model=VocabularyOut, status_code=201)
def add_word(body: VocabularyCreate, db: Session = Depends(get_db)):
    existing = db.query(Vocabulary).filter(Vocabulary.word == body.word).first()
    if existing:
        return VocabularyOut.from_orm_row(existing)
    row = Vocabulary(
        word=body.word,
        phonetic=body.phonetic,
        definitions=json.dumps([d.model_dump() for d in body.definitions], ensure_ascii=False),
        article_id=body.article_id,
        status="new",
    )
    db.add(row)
    db.commit()
    db.refresh(row)
    return VocabularyOut.from_orm_row(row)


@router.delete("/{word}", response_model=MessageOut)
def remove_word(word: str, db: Session = Depends(get_db)):
    row = db.query(Vocabulary).filter(Vocabulary.word == word.lower()).first()
    if not row:
        raise HTTPException(404, detail=f"'{word}' not in vocabulary")
    db.delete(row)
    db.commit()
    return {"message": f"'{word}' removed"}


@router.patch("/{word}/status", response_model=VocabularyOut)
def update_status(word: str, body: ReviewRequest, db: Session = Depends(get_db)):
    row = db.query(Vocabulary).filter(Vocabulary.word == word.lower()).first()
    if not row:
        raise HTTPException(404, detail=f"'{word}' not in vocabulary")
    row.status = body.status
    db.commit()
    db.refresh(row)
    return VocabularyOut.from_orm_row(row)
