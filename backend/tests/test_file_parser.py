"""Tests for services/file_parser.py"""
import pytest
from services.file_parser import parse_file


# ---------------------------------------------------------------------------
# .txt / .md
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_parse_txt_utf8():
    content = "Hello, world!".encode("utf-8")
    result = await parse_file("article.txt", content)
    assert result == "Hello, world!"


@pytest.mark.asyncio
async def test_parse_md():
    content = "# Title\n\nSome **markdown** text.".encode("utf-8")
    result = await parse_file("article.md", content)
    assert "Title" in result
    assert "markdown" in result


@pytest.mark.asyncio
async def test_parse_txt_latin1_fallback():
    # Latin-1 encoded bytes that are invalid UTF-8
    content = "Caf\xe9".encode("latin-1")
    result = await parse_file("notes.txt", content)
    assert "Caf" in result


# ---------------------------------------------------------------------------
# Unsupported format
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_unsupported_format_raises_value_error():
    with pytest.raises(ValueError, match="Unsupported"):
        await parse_file("doc.odt", b"data")


@pytest.mark.asyncio
async def test_unknown_extension_raises_value_error():
    with pytest.raises(ValueError):
        await parse_file("file.xyz", b"data")


# ---------------------------------------------------------------------------
# Empty content
# ---------------------------------------------------------------------------

@pytest.mark.asyncio
async def test_empty_txt():
    result = await parse_file("empty.txt", b"")
    assert result == ""
