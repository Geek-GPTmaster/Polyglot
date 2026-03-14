"""
services/dictionary.py — 词典查询服务
封装对外部词典 API 的调用，返回标准化的释义结构
当前使用：Free Dictionary API (https://api.dictionaryapi.dev)
  - 免费、无需 API Key
  - 有音标、词性、例句
  - 无中文释义（中文释义后续可接入有道/必应词典）
"""
import httpx
from typing import Optional


DICT_API_BASE = "https://api.dictionaryapi.dev/api/v2/entries/en"


async def lookup_word(word: str) -> Optional[dict]:
    """
    调用 Free Dictionary API 查询单词
    返回标准化结构：
    {
        "word": str,
        "phonetic": str,
        "definitions": [{"pos": str, "meaning": str, "example": str}]
    }
    返回 None 表示未找到
    """
    # TODO: 实现 API 调用与响应解析
    # async with httpx.AsyncClient() as client:
    #     resp = await client.get(f"{DICT_API_BASE}/{word.lower()}")
    #     if resp.status_code != 200:
    #         return None
    #     data = resp.json()
    #     return _parse_response(data)
    pass


def _parse_response(data: list) -> dict:
    """
    解析 Free Dictionary API 原始响应
    提取：phonetic、词性、释义、例句
    注意：该 API 返回英文释义，中文释义需额外处理或手动维护
    """
    # TODO: 实现解析逻辑
    pass
