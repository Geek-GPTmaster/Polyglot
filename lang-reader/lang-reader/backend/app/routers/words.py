"""
routers/words.py — 单词查询接口
GET /api/words/{word}   查询单词释义（先查缓存，再调词典 API）
"""
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from app.database import get_db
# from app import models, schemas
# from app.services.dictionary import lookup_word

router = APIRouter()


# TODO: 实现以下接口

# @router.get("/{word}", response_model=schemas.WordOut)
# def get_word(word: str, db: Session = Depends(get_db)):
#     """
#     1. word 转小写 + 词形还原（可选）
#     2. 查 word_definitions 缓存表
#     3. 缓存未命中 → 调用 dictionary service
#     4. 查 vocabulary 表判断 in_vocabulary
#     5. 返回
#     """
#     pass
