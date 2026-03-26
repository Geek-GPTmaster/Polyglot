"""
services/dictionary.py

Looks up word definitions via the Wiktionary REST API with DB caching.

Cache key: (word, language_code)
API:       https://en.wiktionary.org/api/rest_v1/page/definition/{word}

The API returns a JSON object keyed by ISO 639-1 language code (e.g. "en",
"es").  No code changes are needed when new languages are added to the
languages table — Wiktionary already supports them all.
"""

import json
import re
import string
from datetime import datetime, timezone

import httpx
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from models.word_definition import WordDefinition
from schemas.word_definition import WordDefinitionRead

WIKTIONARY_URL = "https://en.wiktionary.org/api/rest_v1/page/definition/{word}"
REQUEST_TIMEOUT = 10.0  # seconds


# ---------------------------------------------------------------------------
# Public API
# ---------------------------------------------------------------------------

async def lookup_word(
    word: str,
    language_code: str,
    db: AsyncSession,
) -> WordDefinitionRead | None:
    """
    1. Normalize word to lowercase, strip leading/trailing punctuation.
    2. Check word_definitions cache for (word, language_code).
    3. On cache hit  → return cached result.
    4. On cache miss → call Wiktionary REST API, parse, cache, return.
    5. If not found or any parse error → return None (silent fail).
    """
    normalized = _normalize(word)
    if not normalized:
        return None

    # --- Cache lookup ---
    cached = await _fetch_from_cache(db, normalized, language_code)
    if cached is not None:
        return _row_to_schema(cached)

    # --- API call ---
    raw_data = await _call_wiktionary(normalized)
    if raw_data is None:
        return None

    parsed = _parse_response(raw_data, language_code)
    if parsed is None:
        return None

    # --- Store in cache ---
    row = await _save_to_cache(db, normalized, language_code, parsed, raw_data)
    return _row_to_schema(row)


# ---------------------------------------------------------------------------
# Normalisation
# ---------------------------------------------------------------------------

def _normalize(word: str) -> str:
    """Lowercase and strip leading/trailing punctuation."""
    word = word.lower().strip()
    word = word.strip(string.punctuation)
    return word


# ---------------------------------------------------------------------------
# Cache helpers
# ---------------------------------------------------------------------------

async def _fetch_from_cache(
    db: AsyncSession,
    word: str,
    language_code: str,
) -> WordDefinition | None:
    stmt = select(WordDefinition).where(
        WordDefinition.word == word,
        WordDefinition.language_code == language_code,
    )
    result = await db.execute(stmt)
    return result.scalar_one_or_none()


async def _save_to_cache(
    db: AsyncSession,
    word: str,
    language_code: str,
    parsed: dict,
    raw_data: dict,
) -> WordDefinition:
    row = WordDefinition(
        word=word,
        language_code=language_code,
        phonetics=parsed.get("phonetics"),
        part_of_speech=parsed.get("part_of_speech"),
        definition=parsed.get("definition"),
        example=parsed.get("example"),
        synonyms=json.dumps(parsed.get("synonyms", [])),
        raw_response=json.dumps(raw_data),
        cached_at=datetime.now(timezone.utc),
    )
    db.add(row)
    await db.commit()
    await db.refresh(row)
    return row


# ---------------------------------------------------------------------------
# Wiktionary HTTP call
# ---------------------------------------------------------------------------

async def _call_wiktionary(word: str) -> dict | None:
    url = WIKTIONARY_URL.format(word=word)
    try:
        async with httpx.AsyncClient(timeout=REQUEST_TIMEOUT) as client:
            response = await client.get(url)
        if response.status_code == 404:
            return None
        response.raise_for_status()
        return response.json()
    except (httpx.HTTPError, ValueError):
        return None


# ---------------------------------------------------------------------------
# Response parser
# ---------------------------------------------------------------------------

def _parse_response(data: dict, language_code: str) -> dict | None:
    """
    Extract the first matching entry for language_code from the Wiktionary
    response.

    Response shape (keys are ISO 639-1 codes):
    {
      "en": [
        {
          "partOfSpeech": "adjective",
          "language": "English",
          "definitions": [
            {
              "definition": "Lasting for a very short time.",
              "parsedExamples": [{"example": "Fashions are ephemeral."}],
              "synonyms": [{"word": "transitory"}, ...]
            }
          ]
        }
      ]
    }
    """
    entries = data.get(language_code)
    if not entries or not isinstance(entries, list):
        return None

    first_entry = entries[0]
    definitions = first_entry.get("definitions") or []
    if not definitions:
        return None

    first_def = definitions[0]

    # Clean HTML tags from definition text
    definition_text = _strip_html(first_def.get("definition", ""))

    # Example: prefer parsedExamples, fall back to examples list
    example_text: str | None = None
    parsed_examples = first_def.get("parsedExamples") or []
    if parsed_examples:
        example_text = _strip_html(parsed_examples[0].get("example", ""))
    else:
        raw_examples = first_def.get("examples") or []
        if raw_examples:
            example_text = _strip_html(raw_examples[0])

    # Synonyms: list of {"word": "..."} dicts → list of strings
    raw_synonyms = first_def.get("synonyms") or []
    synonyms: list[str] = [
        s["word"] for s in raw_synonyms if isinstance(s, dict) and s.get("word")
    ][:10]  # cap at 10

    return {
        "phonetics": None,  # Not available in this endpoint
        "part_of_speech": first_entry.get("partOfSpeech"),
        "definition": definition_text or None,
        "example": example_text or None,
        "synonyms": synonyms,
    }


def _strip_html(text: str) -> str:
    """Remove HTML tags from a string."""
    if not text:
        return text
    return re.sub(r"<[^>]+>", "", text).strip()


# ---------------------------------------------------------------------------
# Schema conversion
# ---------------------------------------------------------------------------

def _row_to_schema(row: WordDefinition) -> WordDefinitionRead:
    synonyms: list[str] = []
    if row.synonyms:
        try:
            synonyms = json.loads(row.synonyms)
        except (json.JSONDecodeError, TypeError):
            synonyms = []

    return WordDefinitionRead(
        word=row.word,
        language_code=row.language_code,
        phonetics=row.phonetics,
        part_of_speech=row.part_of_speech,
        definition=row.definition,
        example=row.example,
        synonyms=synonyms,
    )
