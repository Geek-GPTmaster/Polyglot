"""
services/language_detector.py

Detects the language of a text snippet.
Uses langdetect; samples first 500 chars for speed.
Falls back to 'en' if detection is inconclusive or not in the active languages list.
"""

SAMPLE_LENGTH = 500
FALLBACK_LANGUAGE = "en"


def detect_language(text: str, db_languages: list[str]) -> str:
    """
    Detect language of text.

    Args:
        text:          Text to analyse (only first 500 chars used).
        db_languages:  List of active language codes from the languages table
                       (e.g. ['en', 'es']).  Ensures the returned code is a
                       valid FK value.

    Returns:
        A language_code present in db_languages.
        Falls back to 'en' (or the first entry in db_languages) on failure.
    """
    fallback = FALLBACK_LANGUAGE if FALLBACK_LANGUAGE in db_languages else (db_languages[0] if db_languages else FALLBACK_LANGUAGE)

    if not text or not text.strip():
        return fallback

    try:
        from langdetect import detect, LangDetectException  # type: ignore
    except ImportError:
        return fallback

    try:
        sample = text.strip()[:SAMPLE_LENGTH]
        detected = detect(sample)
        # langdetect returns ISO 639-1 codes which match our language_code column
        return detected if detected in db_languages else fallback
    except Exception:
        return fallback
