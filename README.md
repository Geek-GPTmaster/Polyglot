# Polyglot

A personal language reading + vocabulary learning app.

Supports English and Spanish (v1), extensible to any language without code changes.

## Stack

- **Frontend:** Next.js 14 (App Router) — deployed on Vercel
- **Backend:** FastAPI — deployed on Railway
- **Database:** PostgreSQL 16 — Railway (prod) / Docker (local dev)
- **Mobile:** Capacitor wrapping Next.js → Android APK (Phase 2)

## Local Development

### Prerequisites

- Node.js 18+
- Python 3.11+
- Docker (for local PostgreSQL)

### Start local database

```bash
docker run -d -p 5432:5432 -e POSTGRES_DB=polyglot -e POSTGRES_PASSWORD=dev --name polyglot-db postgres:16
```

### Backend

```bash
cd backend
source venv/bin/activate        # Windows: venv\Scripts\activate
alembic upgrade head
python seed.py
uvicorn main:app --reload --port 8000
```

### Frontend

```bash
cd frontend
npm install
npm run dev
# → http://localhost:3000
```

### Tests

```bash
cd backend
pytest
```

## Project Structure

```
polyglot/
├── frontend/    # Next.js app (App Router)
├── backend/     # FastAPI app
└── docs/        # Spec documents
```

## Docs

| File | Contents |
|------|----------|
| `docs/PRD.md` | Features and user stories |
| `docs/APP_FLOW.md` | Page flows and error states |
| `docs/TECH_STACK.md` | Exact versions and file structure |
| `docs/FRONTEND_GUIDELINES.md` | Design system |
| `docs/BACKEND_STRUCTURE.md` | DB schema and API endpoints |
| `docs/IMPLEMENTATION_PLAN.md` | Build order |
