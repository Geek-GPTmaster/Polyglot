"""
Firebase Cloud Messaging helper.

Set the FIREBASE_CREDENTIALS_JSON environment variable to the full contents of
your Firebase service-account JSON file (the dict, not base64-encoded).

If the variable is absent, all functions return False gracefully — the app
continues to work without push notifications.
"""

import json
import os
import logging

logger = logging.getLogger(__name__)

_app = None


def _init_app():
    global _app
    if _app is not None:
        return _app

    creds_json = os.getenv("FIREBASE_CREDENTIALS_JSON")
    if not creds_json:
        return None

    try:
        import firebase_admin
        from firebase_admin import credentials

        cred_dict = json.loads(creds_json)
        cred = credentials.Certificate(cred_dict)
        _app = firebase_admin.initialize_app(cred)
        logger.info("Firebase Admin SDK initialised.")
    except Exception as exc:
        logger.warning("Failed to initialise Firebase: %s", exc)
        _app = None

    return _app


def send_review_reminder(token: str, due_count: int) -> bool:
    """
    Send a daily review-reminder push to a single FCM token.
    Returns True on success, False on any failure.
    """
    if not _init_app():
        return False

    try:
        from firebase_admin import messaging

        word_label = "word" if due_count == 1 else "words"
        message = messaging.Message(
            notification=messaging.Notification(
                title="Polyglot",
                body=f"You have {due_count} {word_label} due for review.",
            ),
            data={"route": "/review"},
            android=messaging.AndroidConfig(
                notification=messaging.AndroidNotification(
                    icon="ic_notification",
                    color="#4A7C59",  # --color-accent
                ),
            ),
            token=token,
        )
        messaging.send(message)
        return True
    except Exception as exc:
        logger.warning("FCM send failed: %s", exc)
        return False
