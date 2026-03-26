# IMPLEMENTATION_PLAN.md — Polyglot Build Order

**Version:** 2.0  
**Date:** 2026-03-24  
**Rule:** Build in this exact order. Never skip ahead. Each step produces a testable result.

---

## Phase 0: Project Setup

### Step 0.1 — Initialize Repository
- Create `polyglot/` root directory
- Initialize git: `git init`
- Create `.gitignore` (node_modules, .next, __pycache__, *.pyc, polyglot.db, .env, .env.local)
- Create top-level `README.md`

### Step 0.2 — Create Folder Structure
Create all directories as specified in TECH_STACK.md:
```
polyglot/
├── frontend/
├── backend/
└── docs/
```

### Step 0.3 — Initialize Frontend
```bash
cd frontend
npx create-next-app@14.2.5 . --typescript --tailwind --eslint --app --no-src-dir --import-alias "@/*"
```
Install additional packages:
```bash
npm install @tailwindcss/typography@0.5.13 lucide-react@0.383.0
```

### Step 0.4 — Initialize Backend
```bash
cd backend
python -m venv venv
source venv/bin/activate  # or venv\Scripts\activate on Windows
pip install fastapi==0.111.1 uvicorn[standard]==0.30.1 pydantic==2.8.2 pydantic-settings==2.3.4 sqlalchemy==2.0.31 asyncpg==0.29.0 python-multipart==0.0.9 httpx==0.27.0 pdfplumber==0.11.2 python-docx==1.1.2 ebooklib==0.18 beautifulsoup4==4.12.3 lxml==5.2.2 langdetect==1.0.9 alembic==1.13.2 firebase-admin==6.5.0
pip freeze > requirements.txt
```

Local dev database (choose one):
```bash
# Option A: Docker (recommended)
docker run -d -p 5432:5432 -e POSTGRES_DB=polyglot -e POSTGRES_PASSWORD=dev --name polyglot-db postgres:16

# Option B: Local PostgreSQL install
createdb polyglot
```

### Step 0.5 — Copy Docs
Copy all 6 spec documents into `docs/`

**Verification:** Both `cd frontend && npm run dev` and `cd backend && uvicorn main:app` start without errors.

---

## Phase 1: Backend Foundation

### Step 1.1 — Database Setup
Create `backend/database.py`:
- SQLAlchemy async engine pointed at PostgreSQL via `DATABASE_URL` env var
- Connection string format: `postgresql+asyncpg://user:pass@host:5432/polyglot`
- `AsyncSession` factory
- `Base` declarative base
- `get_db` dependency

### Step 1.2 — All Database Models
Create all models in `backend/models/` as specified in BACKEND_STRUCTURE.md:
- `language.py` → `Language` (**create this first** — other models FK to it)
- `article.py` → `Article` (language_code FK → languages.code)
- `vocabulary.py` → `Vocabulary` (language_code FK → languages.code)
- `word_definition.py` → `WordDefinition` (language_code FK → languages.code)
- `save.py` → `Save`
- `tag.py` → `Tag`
- `app_settings.py` → `AppSetting`
- `review_log.py` → `ReviewLog`

### Step 1.3 — Database Initialization via Alembic
Configure Alembic: `alembic init migrations` → set `sqlalchemy.url` in `alembic.ini` to `DATABASE_URL`.

Generate initial migration:
```bash
alembic revision --autogenerate -m "initial_schema"
alembic upgrade head
```

Create `backend/seed.py`:
- Seeds `languages` table: EN+ES active, FR/DE/ZH/JA/PT inactive
- Seeds default tags: Important, Hard, Mastered, Review Later
- Seeds default setting: `daily_review_limit = 20`

Run: `python seed.py`

**Verification:** `alembic current` shows latest revision. Query DB: `SELECT * FROM languages;` returns 7 rows.

### Step 1.4 — All Schemas
Create all Pydantic schemas in `backend/schemas/` matching every API response shape in BACKEND_STRUCTURE.md. Include `language.py` with `LanguageSchema` first.

### Step 1.5 — FastAPI App Entry
Create `backend/main.py`:
- FastAPI app instance
- CORS middleware (allow localhost:3000 and *.vercel.app)
- Health check: `GET /health` → `{ "status": "ok" }`
- (Routers will be mounted in subsequent steps)

**Verification:** `GET http://localhost:8000/health` returns 200.

---

## Phase 2: Backend — Languages & Articles

### Step 2.0 — Languages Router
Create `backend/api/routes/languages.py`:
- `GET /api/languages` — returns active languages by default; `?all=true` returns all including inactive

Mount in `main.py`.

**Verification:** `GET /api/languages` returns EN and ES. `GET /api/languages?all=true` returns all 7 pre-seeded languages. This endpoint is what the frontend NavBar calls — get it right early.

### Step 2.1 — File Parser Service + Language Detector
Create `backend/services/file_parser.py`:
- `parse_file(filename, content_bytes) -> str`
- Handle: `.txt`, `.md`, `.pdf`, `.docx`, `.epub`
- Return plain text string
- Raise descriptive errors on failure

Create `backend/services/language_detector.py`:
- `detect_language(text: str) -> str` → returns `'en'` or `'es'`
- Uses `langdetect` library on first 500 chars
- Falls back to `'en'` if detection fails or is inconclusive

Write tests: `backend/tests/test_file_parser.py`
- Test each format with a sample file
- Test language detection returns `'en'` for English text and `'es'` for Spanish text
- Test error on unsupported format

### Step 2.2 — Articles Router
Create `backend/api/routes/articles.py`:
- `GET /api/articles?language=en` — list by language
- `GET /api/articles/{id}` — get one (includes language field)
- `POST /api/articles/import` — parse file or text, auto-detect language (or use provided), save, return new article
- `PATCH /api/articles/{id}/scroll` — save scroll position

Mount in `main.py`.

**Verification:** POST an English article (no language specified) → auto-detected as `en`. POST a Spanish article → auto-detected as `es`. GET with `?language=en` returns only English articles.

---

## Phase 3: Backend — Dictionary & Vocabulary

### Step 3.1 — Dictionary Service
Create `backend/services/dictionary.py`:
- `lookup_word(word, language_code, db) -> WordDefinitionSchema | None`
- Check `word_definitions` cache using `(word, language_code)` composite key
- Call Wiktionary REST API: `https://en.wiktionary.org/api/rest_v1/page/definition/{word}`
- Parse JSON response to extract entry matching `language_code`
- Store in cache with `language_code` on success
- Return `None` on 404 or any parse error (silent fail for all languages)

**Key benefit:** One API, all languages. No code changes when new languages are activated.

### Step 3.2 — Definitions Router
Create `backend/api/routes/definitions.py`:
- `GET /api/definitions/{word}?language=en` — calls dictionary service with language, returns result or 404

Mount in `main.py`.

**Verification:** `GET /api/definitions/ephemeral?language=en` returns full English data. `GET /api/definitions/libro?language=es` returns Spanish data for "libro". `GET /api/definitions/xyzqwerty123?language=en` returns 404.

### Step 3.3 — Vocabulary Router
Create `backend/api/routes/vocabulary.py`:
- `GET /api/vocabulary` (with optional `tag_id`, `search` params)
- `POST /api/vocabulary` (saves word, auto-fetches definition)
- `PATCH /api/vocabulary/{id}` (update notes/tag)
- `DELETE /api/vocabulary/{id}`

Mount in `main.py`.

**Verification:** Add a word, list it, update its notes, delete it.

---

## Phase 4: Backend — Review, Saves, Tags, Settings, Dashboard, Export

### Step 4.1 — Review Router
Create `backend/api/routes/review.py`:
- `GET /api/review/due` — returns due cards (respects daily limit)
- `POST /api/review/{vocabulary_id}/result` — applies scheduling logic from BACKEND_STRUCTURE.md

### Step 4.2 — Saves Router
Create `backend/api/routes/saves.py`:
- `GET /api/saves` (with optional `type` filter)
- `POST /api/saves`
- `DELETE /api/saves/{id}`

### Step 4.3 — Tags Router
Create `backend/api/routes/tags.py`:
- `GET /api/tags`
- `POST /api/tags`
- `PATCH /api/tags/{id}`
- `DELETE /api/tags/{id}` (sets vocabulary.tag_id to NULL)

### Step 4.4 — Settings Router
Create `backend/api/routes/settings.py`:
- `GET /api/settings`
- `PATCH /api/settings`

### Step 4.5 — Dashboard Endpoint
Add to `main.py` or a new `routes/dashboard.py`:
- `GET /api/dashboard` — aggregates all stats

### Step 4.6 — Export Service + Endpoint
Create `backend/services/export.py`:
- `export_vocabulary_csv(db) -> str`

Add to settings or export router:
- `GET /api/export/vocabulary` — returns CSV file response

Mount all routers in `main.py`.

**Verification:** Full backend test suite passes (`pytest`).

---

## Phase 5: Frontend Foundation

### Step 5.1 — Design System CSS
Create `frontend/styles/globals.css`:
- All CSS custom properties from FRONTEND_GUIDELINES.md
- Paper texture background
- Body font defaults
- Reset/normalize styles

### Step 5.2 — Google Fonts
Update `frontend/app/layout.tsx`:
- Import EB Garamond, Lora, DM Sans, JetBrains Mono from Google Fonts
- Apply `--font-serif`, `--font-sans` etc. via CSS variables

### Step 5.3 — API Client + Types
Create `frontend/lib/types.ts`:
- TypeScript interfaces for all API response shapes
- Key addition: `Language { code: string; name: string; native_name: string; is_active: boolean }`
- `language_code: string` (not a literal union type — must accept any valid code)

Create `frontend/lib/api.ts`:
- `fetchLanguages()` — `GET /api/languages` (called once on load)
- One function per API endpoint, all with try/catch
- All language-scoped calls pass `language` query param from `activeLang`
- localStorage fallback for offline resilience

Create `frontend/lib/storage.ts`:
- `getActiveLang(): string` — reads `polyglot_active_language`, defaults to `'en'`
- `setActiveLang(code: string): void`
- `getFontSize`, `setFontSize`, `getDailyLimit`, `setDailyLimit`

### Step 5.4 — LanguageContext
Create `frontend/lib/context/LanguageContext.tsx`:
- `LanguageProvider` wraps root layout
- Fetches `GET /api/languages` on mount, stores in state
- Exposes `{ activeLang, setActiveLang, languages }`
- `setActiveLang` saves to localStorage and triggers re-renders

**No i18n translation system needed** — UI is English-only in v1.

### Step 5.5 — NavBar + LanguageSwitcher Components
Create `frontend/components/NavBar.tsx`:
- Logo + all 5 nav links (Articles, Vocabulary, Review, Saves, Settings)
- Active link detection via `usePathname()`
- Renders `<LanguageSwitcher />` on the right side
- Mobile: hamburger menu (< 768px), switcher stays visible

Create `frontend/components/LanguageSwitcher.tsx`:
- Reads `languages` and `activeLang` from LanguageContext
- Renders one pill per active language using `native_name` as label
- On click: `setActiveLang(code)`
- **Zero hardcoded language codes** — fully driven by API response

### Step 5.6 — Root Layout
Update `frontend/app/layout.tsx`:
- Wrap with `LanguageProvider`
- Include `NavBar`
- Set `data-font-size` attribute on body from localStorage
- Apply paper background

**Verification:** `npm run dev` shows NavBar on all routes, paper background applied, fonts loading.

---

## Phase 6: Frontend — UI Primitives

### Step 6.1 — Button Component
`frontend/components/ui/Button.tsx`
- Props: `variant` (primary | secondary | danger | ghost), `size`, `onClick`, `disabled`, `children`
- All styles from FRONTEND_GUIDELINES.md

### Step 6.2 — Modal Component
`frontend/components/ui/Modal.tsx`
- Props: `isOpen`, `onClose`, `title`, `children`
- Overlay + animated modal box
- Close on overlay click and Escape key

### Step 6.3 — Toast Component
`frontend/components/ui/Toast.tsx`
- `useToast()` hook
- `ToastProvider` wrapper
- Auto-dismiss after 3s
- Slide-up animation

### Step 6.4 — Tag Chip Component
`frontend/components/ui/TagChip.tsx`
- Props: `tag`, `active`, `onClick`
- Styles from FRONTEND_GUIDELINES.md

---

## Phase 7: Frontend — Dashboard

### Step 7.1 — Dashboard Page
`frontend/app/page.tsx`:
- Fetch from `GET /api/dashboard`
- Show: total articles, total vocabulary, reviewed today, due today
- Due today count + "Start Review" CTA → `/review`
- Recent articles (3 cards) → `/articles/[id]`
- Empty state if no articles

**Verification:** Dashboard loads, stats show (even if 0), links work.

---

## Phase 8: Frontend — Articles

### Step 8.1 — Article List Page
`frontend/app/articles/page.tsx`:
- Fetch all articles
- Article cards grid (responsive)
- "Import Article" button → opens ImportModal
- Empty state

### Step 8.2 — Import Modal Component
`frontend/components/ImportModal.tsx`:
- Two tabs: File Upload | Paste Text
- File upload: drag-and-drop zone + click-to-browse
- Accepts: .txt .md .pdf .docx .epub
- Paste text: textarea + optional title input
- Submit → POST to `/api/articles/import`
- Loading state, error state, success → close modal

**Verification:** Import a .txt file, see it in list.

### Step 8.3 — Article Reader Page
`frontend/app/articles/[id]/page.tsx`:
- Fetch article by ID
- Render text with paragraph breaks
- **Tokenizer**: split text into words + whitespace/punctuation tokens, each word wrapped in `<span>` with click handler
- Fetch vocabulary list to know which words are already saved → apply highlight class
- Save/restore scroll position (via `PATCH /api/articles/{id}/scroll`)

### Step 8.4 — WordCard Component
`frontend/components/WordCard.tsx`:
- Props: `word`, `position`, `onClose`, `onSave`
- On mount: fetch from `/api/definitions/{word}`
- Loading state (spinner in word highlight)
- Display: word, phonetics, part_of_speech, definition, example, synonyms
- "Save to Vocabulary" button → POST to `/api/vocabulary`
- "Saved ✓" state if already saved
- Close on outside click or Escape
- Mobile: render as bottom sheet

**Verification:** Click a word → WordCard opens → Save it → word highlights → open card again → shows "Saved ✓".

### Step 8.5 — Save Context Menu
`frontend/components/SaveContextMenu.tsx`:
- Appears on text selection (mouseup event)
- Two options: "Annotate" | "Quote"
- "Quote" → POST immediately → toast "Quote saved"
- "Annotate" → inline note input → POST with note
- Dismisses on click outside

**Verification:** Select text → context menu → save quote → appears in /saves.

---

## Phase 9: Frontend — Vocabulary

### Step 9.1 — Vocabulary Page
`frontend/app/vocabulary/page.tsx`:
- Fetch all vocabulary
- Render as table (desktop) / cards (mobile)
- Tag filter chips (fetch from `/api/tags`)
- Search input (client-side filter)
- Per-row: tag dropdown, notes edit, delete button
- "Add Word" button → Add Word modal

### Step 9.2 — Add Word Modal
- Word input → auto-fetch definition preview from `/api/definitions/{word}`
- Notes textarea, tag dropdown
- Submit → POST to `/api/vocabulary`

**Verification:** Add a word manually, tag it, edit notes, delete it.

---

## Phase 10: Frontend — Review

### Step 10.1 — Review Page
`frontend/app/review/page.tsx`:
- Fetch from `GET /api/review/due`
- Entry state: count + "Start Review" button
- Empty state: "No cards due today"
- Review loop:
  - FlashCard component (flip animation)
  - Progress indicator
  - "Know it" / "Don't know" buttons
  - POST to `/api/review/{id}/result` on each answer
- Summary screen with counts + buttons

### Step 10.2 — FlashCard Component
`frontend/components/FlashCard.tsx`:
- 3D flip animation (CSS `transform-style: preserve-3d`)
- Front: word (large)
- Back: phonetics, part of speech, definition, example
- Flip on click or Space key

**Verification:** Review session completes, intervals update in DB.

---

## Phase 11: Frontend — Saves

### Step 11.1 — Saves Page
`frontend/app/saves/page.tsx`:
- Fetch all saves
- Filter tabs: All | Annotations | Quotes
- Each save shows: text, source article link, type badge, date
- Delete button with confirmation
- Empty state

**Verification:** Saves from reader appear here, delete works.

---

## Phase 12: Frontend — Settings

### Step 12.1 — Settings Page
`frontend/app/settings/page.tsx`:
- **Display section**: Font size toggle (Small/Medium/Large) + Language toggle (EN/中文)
- **Review section**: Daily limit number input
- **Tags section**: List tags, add/edit/delete
- **Data section**: Export CSV button

**Verification:** Change font size → article text changes. Change language → nav labels change. Export CSV → downloads file.

---

## Phase 13: Polish & Responsive

### Step 13.1 — Mobile Responsiveness Audit
Go through every page on 375px width:
- NavBar: hamburger menu works
- WordCard: renders as bottom sheet
- Article text: readable, words tappable
- Vocabulary: card layout instead of table
- Review: card + buttons fit on screen
- All modals: full-width with proper padding

### Step 13.2 — Empty States
Verify every page has a proper empty state:
- Dashboard: no articles yet → CTA to import
- Article list: no articles → CTA to import
- Vocabulary: no words → CTA to start reading
- Review: no due cards → encouraging message
- Saves: no saves → instruction message

### Step 13.3 — Error States
- Backend offline banner (check on app load)
- Toast on API errors
- Invalid file format error in import modal

### Step 13.4 — Loading States
- Skeleton loaders for list pages
- Spinner for WordCard lookup
- Button loading state during form submissions

---

## Phase 14: Testing & Deployment Prep

### Step 14.1 — Backend Tests
Run full pytest suite. All tests must pass.

### Step 14.2 — Frontend Build Check
```bash
cd frontend && npm run build
```
Zero TypeScript errors. Zero build errors.

### Step 14.3 — Vercel Config
Verify `vercel.json` is correct for frontend-only deployment.

### Step 14.4 — Update `progress.txt`
Mark all phases complete.

---

## Phase 15: Railway + PostgreSQL Deployment

### Step 15.1 — Add Alembic
```bash
cd backend
pip install alembic==1.13.2
alembic init migrations
```
Configure `alembic.ini` and `migrations/env.py` to use `DATABASE_URL` from `.env`.

### Step 15.2 — Generate Initial Migration
```bash
alembic revision --autogenerate -m "initial"
alembic upgrade head
```
**Verification:** All tables created in local PostgreSQL. Run `alembic current` → shows latest revision.

### Step 15.3 — Deploy Backend to Railway
- Create Railway project
- Add PostgreSQL service → copy `DATABASE_URL`
- Add FastAPI service → set `DATABASE_URL` env var
- Set start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
- Run `alembic upgrade head` on Railway via one-off command
- Seed languages and default data

**Verification:** `GET https://your-app.railway.app/health` returns `{ "status": "ok" }`.

### Step 15.4 — Update Frontend API URL
- Set `NEXT_PUBLIC_API_URL` in Vercel dashboard to Railway URL
- Redeploy frontend

**Verification:** Dashboard loads stats from Railway backend.

---

## Phase 16: Capacitor Android Build

### Step 16.1 — Install Capacitor
```bash
cd frontend
npm install @capacitor/core@6.1.2 @capacitor/cli@6.1.2 @capacitor/android@6.1.2
npm install @capacitor/camera@6.0.2 @capacitor/push-notifications@6.0.2 @capacitor/network@6.0.2 @capacitor/preferences@6.0.2
npx cap init Polyglot com.carlos.polyglot --web-dir=out
```

### Step 16.2 — Configure Next.js for Static Export
Update `next.config.js`:
```js
output: 'export'   // Required for Capacitor
```
Run `npm run build` → verify `out/` directory generated.

### Step 16.3 — Add Android Platform
```bash
npx cap add android
npx cap sync
```
**Verification:** `frontend/android/` directory created. Opens in Android Studio without errors.

### Step 16.4 — OCR Camera Import
Install Tesseract.js: `npm install tesseract.js@5.1.0`

Create `frontend/components/CameraImport.tsx`:
- Only renders when `Capacitor.isNativePlatform() === true`
- On tap: `Camera.getPhoto()` → get base64 image
- Pass to `Tesseract.recognize()` → extract text
- Insert extracted text into Import modal paste field

**Verification:** On Android device — tap camera button → photo taken → text appears in import field.

### Step 16.5 — FCM Push Notifications
- Create Firebase project → download `google-services.json`
- Place in `frontend/android/app/`
- Install `firebase@10.12.2` in frontend
- On app launch: `PushNotifications.requestPermissions()` → get token → POST to `/api/notifications/register`
- Install `firebase-admin@6.5.0` in backend
- Place Firebase service account JSON in backend → set `FIREBASE_CREDENTIALS_PATH` env var

**Verification:** App registers token. Trigger `/api/notifications/send-daily` manually → push notification appears on device.

### Step 16.6 — Offline Reading
Create `frontend/lib/offlineCache.ts`:
- On article open: save content to `Preferences.set()`
- On page load: if network unavailable (`Network.getStatus()`), load from cache
- Offline vocabulary saves: queue in `Preferences`, sync on reconnect via `Network` listener

**Verification:** Load article → enable airplane mode → close and reopen article → still readable.

### Step 16.7 — Build APK
```bash
cd frontend
npm run build
npx cap sync android
# Open Android Studio → Build → Generate Signed APK
```

**Verification:** APK installs on Android device. All features work.

---

## Build Order Summary

```
Phase 0:  Project setup
Phase 1:  DB models + init (PostgreSQL)
Phase 2:  Languages + Articles backend
Phase 3:  Dictionary (Wiktionary) + Vocabulary backend
Phase 4:  Review + Saves + Tags + Settings + Dashboard + Export
Phase 5:  Frontend foundation (CSS, API client, LanguageContext, NavBar)
Phase 6:  UI primitives
Phase 7:  Dashboard page
Phase 8:  Articles pages + WordCard + SaveContextMenu
Phase 9:  Vocabulary page
Phase 10: Review page + FlashCard
Phase 11: Saves page
Phase 12: Settings page
Phase 13: Polish (mobile responsive, empty states, errors, loading)
Phase 14: Testing + web deployment (Vercel + Railway)
Phase 15: Railway + PostgreSQL production deployment
Phase 16: Capacitor Android (OCR, FCM, offline, APK build)
```

**Rule:** Never start Phase N+1 until Phase N is verified working.
**Phase 16 requires:** Phase 1–15 all complete and deployed.
