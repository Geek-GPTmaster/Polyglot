"""
services/dictionary.py — 词典查询服务
当前：Free Dictionary API（免费，无需 Key）
后续：替换为有道 / 必应词典获取中文释义
"""
from typing import Optional
import httpx

DICT_API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en"


async def lookup_word(word: str) -> Optional[dict]:
    """
    查询单词，返回标准化结构：
    {
        "word": str,
        "phonetic": str | None,
        "definitions": [{"pos": str, "meaning": str, "example": str}]
    }
    未找到返回 None
    """
    async with httpx.AsyncClient(timeout=5.0) as client:
        try:
            resp = await client.get(f"{DICT_API_BASE}/{word.lower()}")
            if resp.status_code != 200:
                return None
            return _parse(resp.json())
        except Exception:
            return None


def _parse(data: list) -> dict:
    entry     = data[0]
    phonetic  = entry.get("phonetic") or _first_phonetic(entry)
    defs      = []

    for meaning in entry.get("meanings", []):
        pos = meaning.get("partOfSpeech", "")
        for d in meaning.get("definitions", [])[:2]:   # 每词性取前2条
            defs.append({
                "pos":     pos,
                "meaning": d.get("definition", ""),    # 英文释义（中文需另接词典）
                "example": d.get("example", ""),
            })

    return {"word": entry.get("word", ""), "phonetic": phonetic, "definitions": defs}


def _first_phonetic(entry: dict) -> Optional[str]:
    for p in entry.get("phonetics", []):
        if p.get("text"):
            return p["text"]
    return None
