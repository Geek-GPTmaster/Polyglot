"""
api/routes/review.py — 复习接口

POST /api/review/{word}         提交复习结果（写日志 + SRS 计算）
GET  /api/review/stats/summary  今日复习概况
GET  /api/review/{word}/logs    单词复习历史
"""
from __future__ import annotations
from datetime import datetime, timezone, timedelta
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.models.vocabulary import Vocabulary
from app.models.review_log import ReviewLog
from app.schemas.vocabulary import VocabularyOut
from app.schemas.review import ReviewRequest, ReviewLogOut, ReviewSummary

router = APIRouter()


# ── POST /api/review/{word} ──────────────────────────────────

@router.post("/{word}", response_model=VocabularyOut)
def submit_review(word: str, body: ReviewRequest, db: Session = Depends(get_db)):
    """
    提交一次复习结果
    1. 读取当前 SRS 状态快照
    2. 运行简化 SM-2 算法
    3. 写入 review_logs
    4. 更新 vocabulary 行
    """
    row = db.query(Vocabulary).filter(Vocabulary.word == word.lower()).first()
    if not row:
        raise HTTPException(404, detail=f"'{word}' not in vocabulary")

    now        = datetime.now(timezone.utc)
    result     = body.status
    ef_before  = row.ease_factor   or 2.5
    ivl_before = row.interval_days or 1

    ef_after, ivl_after, reps = _srs(result, ef_before, ivl_before, row.repetitions or 0)

    # 写日志
    db.add(ReviewLog(
        word=row.word,
        result=result,
        reviewed_at=now,
        ease_factor_before=ef_before,
        ease_factor_after=ef_after,
        interval_days_before=ivl_before,
        interval_days_after=ivl_after,
    ))

    # 更新生词
    row.status         = result
    row.reviewed_at    = now
    row.ease_factor    = ef_after
    row.interval_days  = ivl_after
    row.repetitions    = reps
    row.next_review_at = now + timedelta(days=ivl_after)

    db.commit()
    db.refresh(row)
    return VocabularyOut.from_orm_row(row)


# ── GET /api/review/stats/summary ───────────────────────────

@router.get("/stats/summary", response_model=ReviewSummary)
def review_summary(db: Session = Depends(get_db)):
    today      = datetime.now(timezone.utc).date()
    today_logs = [
        l for l in db.query(ReviewLog).all()
        if l.reviewed_at and l.reviewed_at.date() == today
    ]
    return ReviewSummary(
        today_reviewed=len(today_logs),
        today_known=   sum(1 for l in today_logs if l.result == "known"),
        today_fuzzy=   sum(1 for l in today_logs if l.result == "fuzzy"),
        today_new=     sum(1 for l in today_logs if l.result == "new"),
        total_words=   db.query(Vocabulary).count(),
        due_count=     _due_count(db),
    )


# ── GET /api/review/{word}/logs ──────────────────────────────

@router.get("/{word}/logs", response_model=List[ReviewLogOut])
def word_logs(word: str, db: Session = Depends(get_db)):
    return (
        db.query(ReviewLog)
        .filter(ReviewLog.word == word.lower())
        .order_by(ReviewLog.reviewed_at.desc())
        .all()
    )


# ── 内部：SRS 算法 ───────────────────────────────────────────

def _srs(result: str, ef: float, interval: int, reps: int) -> tuple[float, int, int]:
    """
    简化版 SM-2 算法。
    quality: known=5, fuzzy=3, new=1
    返回 (ease_factor, interval_days, repetitions)
    后续替换为完整 SM-2 / FSRS 只需修改此函数。
    """
    q = {"known": 5, "fuzzy": 3, "new": 1}.get(result, 3)

    if q < 3:
        new_reps, new_ivl = 0, 1
    else:
        new_reps = reps + 1
        new_ivl  = 1 if new_reps == 1 else 3 if new_reps == 2 else round(interval * ef)

    new_ef = max(1.3, ef + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02))
    return round(new_ef, 4), new_ivl, new_reps


def _due_count(db: Session) -> int:
    now = datetime.now(timezone.utc)
    return db.query(Vocabulary).filter(
        (Vocabulary.next_review_at == None) | (Vocabulary.next_review_at <= now)
    ).count()
