"""
routers/vocabulary.py — 生词本 + 复习接口

生词本 CRUD：
  GET    /api/vocabulary                      列表（?status=）
  POST   /api/vocabulary                      新增
  DELETE /api/vocabulary/{word}               删除
  PATCH  /api/vocabulary/{word}/status        仅更新状态

复习相关：
  POST   /api/vocabulary/{word}/review        提交复习结果（写日志 + 更新状态）
  GET    /api/vocabulary/{word}/logs          查看某单词的复习历史
  GET    /api/vocabulary/stats/summary        本轮统计（今日复习概况）
"""
from __future__ import annotations
import json
from datetime import datetime, timezone, timedelta
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.orm import Session

from app.database import get_db
from app.models import Vocabulary, ReviewLog
from app.schemas import (
    VocabularyCreate, VocabularyOut,
    StatusUpdate, ReviewLogOut, MessageOut,
)

router = APIRouter()


# ═══════════════════════════════════════════════════════════
#  生词本 CRUD
# ═══════════════════════════════════════════════════════════

@router.get("/", response_model=List[VocabularyOut])
def list_vocabulary(
    status: Optional[str] = Query(None),
    db: Session = Depends(get_db),
):
    q = db.query(Vocabulary)
    if status:
        q = q.filter(Vocabulary.status == status)
    rows = q.order_by(Vocabulary.added_at.desc()).all()
    return [VocabularyOut.from_orm_row(r) for r in rows]


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
def update_status(word: str, body: StatusUpdate, db: Session = Depends(get_db)):
    row = db.query(Vocabulary).filter(Vocabulary.word == word.lower()).first()
    if not row:
        raise HTTPException(404, detail=f"'{word}' not in vocabulary")
    row.status = body.status
    db.commit()
    db.refresh(row)
    return VocabularyOut.from_orm_row(row)


# ═══════════════════════════════════════════════════════════
#  复习核心接口
# ═══════════════════════════════════════════════════════════

@router.post("/{word}/review", response_model=VocabularyOut)
def submit_review(word: str, body: StatusUpdate, db: Session = Depends(get_db)):
    """
    提交一次复习结果：
    1. 记录到 review_logs（含 SRS 字段快照）
    2. 更新 vocabulary.status / reviewed_at
    3. 预留 SM-2 计算位置（目前仅做简单 interval 调整）
    """
    row = db.query(Vocabulary).filter(Vocabulary.word == word.lower()).first()
    if not row:
        raise HTTPException(404, detail=f"'{word}' not in vocabulary")

    now = datetime.now(timezone.utc)
    result = body.status   # known | fuzzy | new

    # ── 快照旧值 ────────────────────────────────────────────
    ef_before  = row.ease_factor   or 2.5
    ivl_before = row.interval_days or 1

    # ── 简易 SRS：为后续 SM-2 占位 ──────────────────────────
    ef_after, ivl_after, reps = _simple_srs(
        result, ef_before, ivl_before, row.repetitions or 0
    )

    # ── 写复习日志 ──────────────────────────────────────────
    log = ReviewLog(
        word=row.word,
        result=result,
        reviewed_at=now,
        ease_factor_before=ef_before,
        ease_factor_after=ef_after,
        interval_days_before=ivl_before,
        interval_days_after=ivl_after,
    )
    db.add(log)

    # ── 更新生词本行 ─────────────────────────────────────────
    row.status         = result
    row.reviewed_at    = now
    row.ease_factor    = ef_after
    row.interval_days  = ivl_after
    row.repetitions    = reps
    row.next_review_at = now + timedelta(days=ivl_after)

    db.commit()
    db.refresh(row)
    return VocabularyOut.from_orm_row(row)


@router.get("/stats/summary")
def review_summary(db: Session = Depends(get_db)):
    """今日复习概况：各状态计数"""
    today = datetime.now(timezone.utc).date()
    logs = db.query(ReviewLog).all()
    today_logs = [l for l in logs if l.reviewed_at and l.reviewed_at.date() == today]

    return {
        "today_reviewed": len(today_logs),
        "today_known":    sum(1 for l in today_logs if l.result == "known"),
        "today_fuzzy":    sum(1 for l in today_logs if l.result == "fuzzy"),
        "today_new":      sum(1 for l in today_logs if l.result == "new"),
        "total_words":    db.query(Vocabulary).count(),
        "due_count":      _due_count(db),
    }


@router.get("/{word}/logs", response_model=List[ReviewLogOut])
def word_logs(word: str, db: Session = Depends(get_db)):
    """查询某单词的完整复习历史"""
    logs = (
        db.query(ReviewLog)
        .filter(ReviewLog.word == word.lower())
        .order_by(ReviewLog.reviewed_at.desc())
        .all()
    )
    return logs


# ═══════════════════════════════════════════════════════════
#  内部工具函数
# ═══════════════════════════════════════════════════════════

def _simple_srs(
    result: str,
    ef: float,
    interval: int,
    reps: int,
) -> tuple[float, int, int]:
    """
    简化版间隔复习计算（SM-2 精简实现）
    后续可替换为完整 SM-2 或 FSRS 算法。

    返回 (ease_factor, interval_days, repetitions)

    result 映射分数：
      known  → 5（完全记住）
      fuzzy  → 3（模糊，勉强记住）
      new    → 1（完全不认识）
    """
    quality = {"known": 5, "fuzzy": 3, "new": 1}.get(result, 3)

    if quality < 3:
        # 答错：重置间隔，不累计重复次数
        new_reps = 0
        new_interval = 1
    else:
        # 答对：按 SM-2 公式推进间隔
        new_reps = reps + 1
        if new_reps == 1:
            new_interval = 1
        elif new_reps == 2:
            new_interval = 3
        else:
            new_interval = round(interval * ef)

    # 更新 ease_factor（SM-2 公式）
    new_ef = ef + (0.1 - (5 - quality) * (0.08 + (5 - quality) * 0.02))
    new_ef = max(1.3, new_ef)   # 下限 1.3

    return round(new_ef, 4), new_interval, new_reps


def _due_count(db: Session) -> int:
    """到期待复习单词数（next_review_at <= 现在，或从未复习）"""
    now = datetime.now(timezone.utc)
    return (
        db.query(Vocabulary)
        .filter(
            (Vocabulary.next_review_at == None) |
            (Vocabulary.next_review_at <= now)
        )
        .count()
    )
