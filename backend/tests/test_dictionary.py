"""Tests for services/dictionary.py — parser and normalizer (no DB/HTTP required)."""
import json
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

from services.dictionary import (
    _normalize,
    _parse_response,
    _strip_html,
    lookup_word,
)


# ---------------------------------------------------------------------------
# _normalize
# ---------------------------------------------------------------------------

def test_normalize_lowercase():
    assert _normalize("Hello") == "hello"


def test_normalize_strips_punctuation():
    assert _normalize('"word"') == "word"
    assert _normalize("word.") == "word"
    assert _normalize("...word...") == "word"


def test_normalize_empty():
    assert _normalize("") == ""
    assert _normalize("   ") == ""


def test_normalize_already_clean():
    assert _normalize("ephemeral") == "ephemeral"


# ---------------------------------------------------------------------------
# _strip_html
# ---------------------------------------------------------------------------

def test_strip_html_basic():
    assert _strip_html("<b>hello</b>") == "hello"


def test_strip_html_nested():
    assert _strip_html("<a href='x'><i>text</i></a>") == "text"


def test_strip_html_empty():
    assert _strip_html("") == ""


def test_strip_html_no_tags():
    assert _strip_html("plain text") == "plain text"


# ---------------------------------------------------------------------------
# _parse_response
# ---------------------------------------------------------------------------

SAMPLE_RESPONSE = {
    "en": [
        {
            "partOfSpeech": "adjective",
            "language": "English",
            "definitions": [
                {
                    "definition": "Lasting for a very short time.",
                    "parsedExamples": [{"example": "Fashions are <i>ephemeral</i>."}],
                    "synonyms": [
                        {"word": "transitory"},
                        {"word": "fleeting"},
                        {"word": "momentary"},
                    ],
                }
            ],
        }
    ]
}


def test_parse_response_english():
    result = _parse_response(SAMPLE_RESPONSE, "en")
    assert result is not None
    assert result["part_of_speech"] == "adjective"
    assert "short time" in result["definition"]
    assert result["example"] == "Fashions are ephemeral."   # HTML stripped
    assert "transitory" in result["synonyms"]
    assert "fleeting" in result["synonyms"]


def test_parse_response_wrong_language_returns_none():
    result = _parse_response(SAMPLE_RESPONSE, "es")
    assert result is None


def test_parse_response_empty_data():
    assert _parse_response({}, "en") is None


def test_parse_response_no_definitions():
    data = {"en": [{"partOfSpeech": "noun", "language": "English", "definitions": []}]}
    assert _parse_response(data, "en") is None


def test_parse_response_synonyms_capped_at_10():
    many_synonyms = [{"word": f"syn{i}"} for i in range(20)]
    data = {
        "en": [
            {
                "partOfSpeech": "noun",
                "language": "English",
                "definitions": [
                    {
                        "definition": "A thing.",
                        "parsedExamples": [],
                        "synonyms": many_synonyms,
                    }
                ],
            }
        ]
    }
    result = _parse_response(data, "en")
    assert result is not None
    assert len(result["synonyms"]) == 10


def test_parse_response_fallback_to_examples_list():
    data = {
        "en": [
            {
                "partOfSpeech": "verb",
                "language": "English",
                "definitions": [
                    {
                        "definition": "To run.",
                        "parsedExamples": [],
                        "examples": ["He runs fast."],
                        "synonyms": [],
                    }
                ],
            }
        ]
    }
    result = _parse_response(data, "en")
    assert result["example"] == "He runs fast."


# ---------------------------------------------------------------------------
# lookup_word — cache hit path (no HTTP)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_lookup_word_cache_hit():
    """When the DB already has an entry, Wiktionary is never called."""
    from models.word_definition import WordDefinition

    cached_row = WordDefinition(
        word="ephemeral",
        language_code="en",
        phonetics=None,
        part_of_speech="adjective",
        definition="Lasting for a very short time.",
        example="Fashions are ephemeral.",
        synonyms=json.dumps(["transitory", "fleeting"]),
        raw_response="{}",
    )

    mock_db = AsyncMock()
    mock_result = MagicMock()
    mock_result.scalar_one_or_none.return_value = cached_row
    mock_db.execute.return_value = mock_result

    with patch("services.dictionary._call_wiktionary") as mock_api:
        result = await lookup_word("Ephemeral", "en", mock_db)

    mock_api.assert_not_called()
    assert result is not None
    assert result.word == "ephemeral"
    assert result.part_of_speech == "adjective"
    assert "transitory" in result.synonyms


# ---------------------------------------------------------------------------
# lookup_word — cache miss, API success
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_lookup_word_api_success():
    """On cache miss, calls Wiktionary, parses, saves to DB, returns result."""
    mock_db = AsyncMock()

    # First execute (cache lookup) returns None
    miss_result = MagicMock()
    miss_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = miss_result

    # Simulate the saved row returned after commit
    from models.word_definition import WordDefinition
    saved_row = WordDefinition(
        word="ephemeral",
        language_code="en",
        phonetics=None,
        part_of_speech="adjective",
        definition="Lasting for a very short time.",
        example="Fashions are ephemeral.",
        synonyms=json.dumps(["transitory"]),
        raw_response=json.dumps(SAMPLE_RESPONSE),
    )
    mock_db.refresh = AsyncMock(side_effect=lambda row: None)

    async def fake_refresh(row):
        row.word = saved_row.word
        row.language_code = saved_row.language_code
        row.phonetics = saved_row.phonetics
        row.part_of_speech = saved_row.part_of_speech
        row.definition = saved_row.definition
        row.example = saved_row.example
        row.synonyms = saved_row.synonyms
        row.raw_response = saved_row.raw_response

    mock_db.refresh = AsyncMock(side_effect=fake_refresh)

    with patch("services.dictionary._call_wiktionary", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = SAMPLE_RESPONSE
        result = await lookup_word("ephemeral", "en", mock_db)

    mock_api.assert_called_once_with("ephemeral")
    assert result is not None
    assert result.definition == "Lasting for a very short time."


# ---------------------------------------------------------------------------
# lookup_word — API returns None (404 or error)
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_lookup_word_api_not_found():
    mock_db = AsyncMock()
    miss_result = MagicMock()
    miss_result.scalar_one_or_none.return_value = None
    mock_db.execute.return_value = miss_result

    with patch("services.dictionary._call_wiktionary", new_callable=AsyncMock) as mock_api:
        mock_api.return_value = None
        result = await lookup_word("xyzzy123", "en", mock_db)

    assert result is None


# ---------------------------------------------------------------------------
# lookup_word — empty/blank word
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_lookup_word_empty_returns_none():
    mock_db = AsyncMock()
    result = await lookup_word("", "en", mock_db)
    assert result is None

    result2 = await lookup_word("...", "en", mock_db)
    assert result2 is None
