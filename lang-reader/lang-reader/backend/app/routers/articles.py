"""
routers/articles.py — 文章相关接口
POST   /api/articles        上传 / 粘贴文章
GET    /api/articles        获取文章列表
GET    /api/articles/{id}   获取单篇文章
DELETE /api/articles/{id}   删除文章
"""
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
# from app import models, schemas  # TODO: 取消注释

router = APIRouter()


# TODO: 实现以下接口

# @router.post("/", response_model=schemas.ArticleOut)
# def create_article(article: schemas.ArticleCreate, db: Session = Depends(get_db)):
#     pass

# @router.get("/", response_model=list[schemas.ArticleListItem])
# def list_articles(db: Session = Depends(get_db)):
#     pass

# @router.get("/{article_id}", response_model=schemas.ArticleOut)
# def get_article(article_id: int, db: Session = Depends(get_db)):
#     pass

# @router.delete("/{article_id}")
# def delete_article(article_id: int, db: Session = Depends(get_db)):
#     pass
