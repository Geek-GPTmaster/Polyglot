# Polyglot

A personal language-learning reading app — import articles, look up words, build vocabulary, and review with flashcards. Paper-and-ink aesthetic, single-user, no login required.

**Web:** Next.js 14 on Vercel · **API:** FastAPI on Railway · **DB:** PostgreSQL 16 · **Mobile:** Capacitor Android

---

## Features

| Feature | Details |
|---------|---------|
| **Article import** | Upload `.txt` `.md` `.pdf` `.docx` `.epub` or paste text |
| **Camera OCR** | Scan printed text with the phone camera (Android) |
| **Interactive reader** | Click any word to look up its definition (Wiktionary) |
| **Text selection** | Highlight a phrase to save it as a Quote or Annotation |
| **Vocabulary** | Auto-populated from word lookups; tag, annotate, export CSV |
| **SRS review** | Flashcard review — Know it / Don't know — simple interval scheduling |
| **Saves** | Browse all your highlighted quotes and annotations |
| **Multi-language** | EN + ES active by default; add any language with one SQL line |
| **Offline reading** | Articles cached on-device; readable without internet (Android) |
| **Push notifications** | Daily review reminder via FCM (Android) |

---

## Quick Start (local dev)

### Prerequisites
- Node.js 18+
- Python 3.11+
- Docker (PostgreSQL)

### 1. Start the database

```bash
docker run -d -p 5432:5432 \
  -e POSTGRES_DB=polyglot \
  -e POSTGRES_PASSWORD=dev \
  --name polyglot-db postgres:16
```

### 2. Backend

```bash
cd backend

# Create venv (first time only)
python -m venv venv

# Activate
source venv/bin/activate        # macOS/Linux
venv\Scripts\activate           # Windows

# Install dependencies
pip install -r requirements.txt

# Copy env file
cp .env.example .env            # edit DATABASE_URL if needed

# Run migrations + seed
alembic upgrade head
python seed.py

# Start API
uvicorn main:app --reload --port 8000
# → http://localhost:8000/api/health
```

### 3. Frontend

```bash
cd frontend
npm install

# Copy env file
cp .env.local.example .env.local   # NEXT_PUBLIC_API_URL=http://localhost:8000

npm run dev
# → http://localhost:3000
```

### 4. Tests

```bash
cd backend && pytest   # 31 tests
```

---

## Deployment

### Railway (backend + PostgreSQL)

1. Create a new Railway project → **Add service → Database → PostgreSQL 16**
2. Add a second service → **Deploy from GitHub** → select the `backend/` folder
   (or point Railway at the root and set `RAILWAY_DOCKERFILE_PATH=backend/Dockerfile`)
3. Set environment variables on the backend service:

   | Variable | Value |
   |----------|-------|
   | `DATABASE_URL` | Railway PostgreSQL internal URL (auto-injected if same project) |
   | `FIREBASE_CREDENTIALS_JSON` | Firebase service-account JSON string (for push notifications; optional) |

4. Railway reads `backend/railway.toml` — it runs `alembic upgrade head && python seed.py` on every deploy then starts `uvicorn`.

### Vercel (frontend)

1. Import the GitHub repo on Vercel
2. Set **Root Directory** → `frontend`
3. Set environment variable:

   | Variable | Value |
   |----------|-------|
   | `NEXT_PUBLIC_API_URL` | Railway backend URL (e.g. `https://polyglot-api.up.railway.app`) |

4. Deploy — Vercel picks up `frontend/vercel.json` automatically.

---

## Android Build

### First-time setup

```bash
cd frontend

# Install Capacitor + native plugins (first time or after adding deps)
npm install

# Add the Android platform (generates /android directory)
npx cap add android
```

### Build APK

```bash
# Set your production API URL
export NEXT_PUBLIC_API_URL=https://your-api.up.railway.app

# Build Next.js static export + sync to Android assets
npm run build:android          # = CAPACITOR_BUILD=true next build && npx cap sync android

# Open Android Studio (requires Android Studio to be installed)
npm run cap:open               # = npx cap open android
```

Inside Android Studio: **Build → Generate Signed Bundle / APK**.

### Push notifications setup (Firebase)

1. Create a Firebase project at [console.firebase.google.com](https://console.firebase.google.com)
2. Add an Android app — package name: `com.polyglot.app`
3. Download `google-services.json` → place in `android/app/`
4. Go to **Project Settings → Service Accounts** → Generate new private key
5. Set `FIREBASE_CREDENTIALS_JSON` on Railway to the contents of that JSON file

---

## Add a new language

No code changes needed. Two options:

```sql
-- Enable a pre-seeded language (FR, DE, ZH, JA, PT are already in the DB):
UPDATE languages SET is_active = true WHERE code = 'fr';

-- Add a brand-new language:
INSERT INTO languages VALUES ('ko', 'Korean', '한국어', true);
```

Restart the backend → the language switcher in the navbar updates automatically.

---

## Project structure

```
polyglot/
├── backend/
│   ├── api/routes/         10 route modules (articles, vocabulary, review, …)
│   ├── models/             8 SQLAlchemy models
│   ├── services/           file_parser, language_detector, dictionary, export, fcm
│   ├── migrations/         Alembic — single initial migration
│   ├── tests/              31 pytest tests
│   └── main.py             FastAPI app + CORS
│
├── frontend/
│   ├── app/                Next.js App Router pages (7 pages)
│   ├── components/         14 React components (Button, Modal, Toast, WordCard, …)
│   ├── lib/                api.ts, types.ts, context, storage, offline, camera, …
│   └── capacitor.config.ts Android configuration
│
└── docs/                   PRD, TECH_STACK, APP_FLOW, FRONTEND_GUIDELINES, …
```

---

## API reference

Base URL: `http://localhost:8000` (local) or your Railway URL (prod)

| Method | Path | Description |
|--------|------|-------------|
| GET | `/api/health` | Health check |
| GET | `/api/languages` | List active languages |
| GET/POST | `/api/articles` | List / import articles |
| GET/PATCH | `/api/articles/{id}` | Read article / update scroll |
| GET | `/api/definitions/{word}` | Word definition (Wiktionary) |
| GET/POST/PATCH/DELETE | `/api/vocabulary` | Vocabulary CRUD |
| GET/POST | `/api/review/due` / `/api/review/{id}/result` | SRS review |
| GET/POST/DELETE | `/api/saves` | Quotes & annotations |
| GET/POST/PUT/DELETE | `/api/tags` | Tag management |
| GET/PATCH | `/api/settings` | App settings (daily limit, font size) |
| GET | `/api/dashboard` | Dashboard stats |
| GET | `/api/export/vocabulary` | CSV export |
| POST | `/api/notifications/subscribe` | Register FCM token |
| POST | `/api/notifications/send-daily` | Trigger review reminder push |

---

## Tech decisions

- **Single user, no auth** — personal tool, no login needed
- **Wiktionary** — free dictionary API, no key required
- **`language_code` as FK everywhere** — add languages via SQL, zero code changes
- **Alembic** — proper migration history, safe Railway deploys
- **asyncpg** — native async PostgreSQL driver (no sync fallback)
- **Capacitor** — wraps the same Next.js app as an Android WebView; no code duplication
- **Tesseract.js** — client-side OCR, no server roundtrip for camera scans
- **`output: 'export'` on `CAPACITOR_BUILD=true`** — static export for Capacitor, standard SSR for Vercel

---

## License

MIT
