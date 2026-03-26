"""Tests for services/language_detector.py"""
import pytest
from services.language_detector import detect_language

ACTIVE_LANGS = ["en", "es"]


def test_detect_english():
    text = "The quick brown fox jumps over the lazy dog. Language learning is a rewarding journey."
    result = detect_language(text, ACTIVE_LANGS)
    assert result == "en"


def test_detect_spanish():
    text = "El zorro marrón rápido salta sobre el perro perezoso. Aprender idiomas es gratificante."
    result = detect_language(text, ACTIVE_LANGS)
    assert result == "es"


def test_fallback_on_empty_string():
    result = detect_language("", ACTIVE_LANGS)
    assert result == "en"


def test_fallback_on_whitespace_only():
    result = detect_language("   \n\t  ", ACTIVE_LANGS)
    assert result == "en"


def test_fallback_when_detected_not_in_db_languages():
    # French text, but only EN+ES are active
    text = "Bonjour le monde. L'apprentissage des langues est une aventure enrichissante."
    result = detect_language(text, ACTIVE_LANGS)
    # Must return a code in ACTIVE_LANGS, not 'fr'
    assert result in ACTIVE_LANGS


def test_fallback_when_db_languages_empty():
    result = detect_language("Hello world", [])
    assert result == "en"


def test_only_first_500_chars_sampled():
    # Build a text that starts with 500 chars of English, then switches to Spanish
    english_block = ("This is English text. " * 30)[:500]
    spanish_tail = " Esto es texto en español que continúa más allá del límite."
    text = english_block + spanish_tail
    result = detect_language(text, ACTIVE_LANGS)
    assert result == "en"
