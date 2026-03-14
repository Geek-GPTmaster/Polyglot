"""
main.py — Polyglot FastAPI 入口
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.core.database import init_db
from app.api.routes import vocabulary, review, articles

settings = get_settings()

app = FastAPI(
    title=f"{settings.APP_NAME} API",
    version=settings.APP_VERSION,
    description="Polyglot — 英文阅读学习器后端",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("startup")
def startup():
    init_db()


# ── 路由注册 ─────────────────────────────────────────────────
app.include_router(vocabulary.router, prefix="/api/vocabulary", tags=["vocabulary"])
app.include_router(review.router,     prefix="/api/review",     tags=["review"])
app.include_router(articles.router,   prefix="/api/articles",   tags=["articles"])


# ── 健康检查 ─────────────────────────────────────────────────
@app.get("/", tags=["health"])
def root():
    return {"status": "ok", "app": settings.APP_NAME, "version": settings.APP_VERSION}

@app.get("/api/health", tags=["health"])
def health():
    return {"status": "ok"}
