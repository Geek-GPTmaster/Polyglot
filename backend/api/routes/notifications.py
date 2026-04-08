"""
Push-notification endpoints.

POST /api/notifications/subscribe   — register / update FCM token (called by the
                                      Capacitor app after receiving the token from
                                      PushNotifications.addListener('registration'))

POST /api/notifications/send-daily  — check due vocabulary and send a push if any
                                      words are due.  Can be called:
                                        • by the Capacitor app on startup (online)
                                        • by Railway's cron (add a cron job that
                                          POSTs to this URL every morning)
"""

import asyncio
from datetime import datetime, timezone

from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from database import get_db
from models.app_settings import AppSetting
from models.vocabulary import Vocabulary
from services.fcm import send_review_reminder

router = APIRouter(prefix="/api/notifications", tags=["notifications"])


class SubscribeRequest(BaseModel):
    token: str


@router.post("/subscribe", status_code=204)
async def subscribe(body: SubscribeRequest, db: AsyncSession = Depends(get_db)):
    """Save the device's FCM token so the backend can send reminders."""
    existing = await db.get(AppSetting, "fcm_token")
    if existing:
        existing.value = body.token
    else:
        db.add(AppSetting(key="fcm_token", value=body.token))
    await db.commit()


@router.post("/send-daily")
async def send_daily(db: AsyncSession = Depends(get_db)):
    """
    Count vocabulary due for review and send a push notification if any.
    Returns { sent: bool, due_count: int }.
    """
    token_row = await db.get(AppSetting, "fcm_token")
    if not token_row or not token_row.value:
        return {"sent": False, "due_count": 0, "reason": "no_token"}

    now = datetime.now(timezone.utc)
    due_count: int = await db.scalar(
        select(func.count(Vocabulary.id)).where(Vocabulary.next_review_at <= now)
    ) or 0

    if due_count == 0:
        return {"sent": False, "due_count": 0, "reason": "nothing_due"}

    # firebase-admin is synchronous — run in thread pool to avoid blocking the loop
    sent = await asyncio.to_thread(send_review_reminder, token_row.value, due_count)
    return {"sent": sent, "due_count": due_count}
