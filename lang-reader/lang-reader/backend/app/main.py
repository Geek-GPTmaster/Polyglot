"""
main.py — FastAPI 应用入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import init_db
from app.routers import vocabulary

app = FastAPI(
    title="LangReader API",
    version="0.2.0",
    description="语言学习阅读器后端",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()   # 自动建表，幂等安全


# ── 路由注册 ────────────────────────────────────────────────
app.include_router(vocabulary.router, prefix="/api/vocabulary", tags=["vocabulary"])
# 后续扩展：
# app.include_router(articles.router, prefix="/api/articles", tags=["articles"])
# app.include_router(words.router,    prefix="/api/words",    tags=["words"])


@app.get("/")
def health():
    return {"status": "ok", "version": "0.2.0"}


@app.get("/api/health")
def api_health():
    return {"status": "ok"}
