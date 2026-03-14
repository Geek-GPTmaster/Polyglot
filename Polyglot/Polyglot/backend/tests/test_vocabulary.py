"""
tests/test_vocabulary.py — 生词本接口测试
运行：pytest tests/ -v
"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.core.database import Base, get_db

# ── 使用内存 SQLite，测试互不影响 ──────────────────────────
TEST_DB_URL = "sqlite://"

engine = create_engine(TEST_DB_URL, connect_args={"check_same_thread": False})
TestSession = sessionmaker(autocommit=False, autoflush=False, bind=engine)


def override_get_db():
    db = TestSession()
    try:
        yield db
    finally:
        db.close()


@pytest.fixture(autouse=True)
def setup_db():
    from app.models import vocabulary, review_log  # noqa
    Base.metadata.create_all(bind=engine)
    app.dependency_overrides[get_db] = override_get_db
    yield
    Base.metadata.drop_all(bind=engine)
    app.dependency_overrides.clear()


client = TestClient(app)

SAMPLE = {
    "word": "ephemeral",
    "phonetic": "/ɪˈfem.ər.əl/",
    "definitions": [{"pos": "adjective", "meaning": "短暂的", "example": "Fame is ephemeral."}],
}


def test_health():
    r = client.get("/api/health")
    assert r.status_code == 200
    assert r.json()["status"] == "ok"


def test_add_word():
    r = client.post("/api/vocabulary", json=SAMPLE)
    assert r.status_code == 201
    assert r.json()["word"] == "ephemeral"
    assert r.json()["status"] == "new"


def test_add_word_idempotent():
    client.post("/api/vocabulary", json=SAMPLE)
    r = client.post("/api/vocabulary", json=SAMPLE)
    assert r.status_code == 201   # 幂等，不报错


def test_list_vocabulary():
    client.post("/api/vocabulary", json=SAMPLE)
    r = client.get("/api/vocabulary")
    assert r.status_code == 200
    assert len(r.json()) == 1


def test_filter_by_status():
    client.post("/api/vocabulary", json=SAMPLE)
    r = client.get("/api/vocabulary?status=new")
    assert len(r.json()) == 1
    r2 = client.get("/api/vocabulary?status=known")
    assert len(r2.json()) == 0


def test_update_status():
    client.post("/api/vocabulary", json=SAMPLE)
    r = client.patch("/api/vocabulary/ephemeral/status", json={"status": "known"})
    assert r.status_code == 200
    assert r.json()["status"] == "known"


def test_delete_word():
    client.post("/api/vocabulary", json=SAMPLE)
    r = client.delete("/api/vocabulary/ephemeral")
    assert r.status_code == 200
    r2 = client.get("/api/vocabulary")
    assert len(r2.json()) == 0


def test_delete_nonexistent():
    r = client.delete("/api/vocabulary/notexist")
    assert r.status_code == 404


def test_submit_review():
    client.post("/api/vocabulary", json=SAMPLE)
    r = client.post("/api/review/ephemeral", json={"status": "known"})
    assert r.status_code == 200
    assert r.json()["status"] == "known"
    assert r.json()["repetitions"] == 1


def test_review_summary():
    client.post("/api/vocabulary", json=SAMPLE)
    client.post("/api/review/ephemeral", json={"status": "known"})
    r = client.get("/api/review/stats/summary")
    assert r.status_code == 200
    data = r.json()
    assert data["total_words"] == 1
    assert data["today_reviewed"] == 1
    assert data["today_known"] == 1


def test_word_logs():
    client.post("/api/vocabulary", json=SAMPLE)
    client.post("/api/review/ephemeral", json={"status": "known"})
    client.post("/api/review/ephemeral", json={"status": "fuzzy"})
    r = client.get("/api/review/ephemeral/logs")
    assert r.status_code == 200
    assert len(r.json()) == 2
