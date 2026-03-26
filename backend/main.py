from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic_settings import BaseSettings

from api.routes import (
    articles,
    dashboard,
    definitions,
    export,
    languages,
    review,
    saves,
    settings,
    tags,
    vocabulary,
)


class AppSettings(BaseSettings):
    cors_origins: str = "http://localhost:3000"

    class Config:
        env_file = ".env"
        extra = "ignore"


app_settings = AppSettings()

app = FastAPI(title="Polyglot API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",       # local dev
        "https://*.vercel.app",        # Vercel preview/prod
        "capacitor://localhost",       # Capacitor Android (Phase 2)
        "http://localhost",            # Capacitor fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# --- Routers ---
app.include_router(languages.router)
app.include_router(articles.router)
app.include_router(definitions.router)
app.include_router(vocabulary.router)
app.include_router(review.router)
app.include_router(saves.router)
app.include_router(tags.router)
app.include_router(settings.router)
app.include_router(dashboard.router)
app.include_router(export.router)


@app.get("/api/health")
async def health_check():
    return {"status": "ok"}
