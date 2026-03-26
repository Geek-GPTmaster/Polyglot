# BACKEND_STRUCTURE.md — Polyglot Backend Structure

**Version:** 2.3 (PostgreSQL + Railway + FCM)
**Date:** 2026-03-24

---

## Database Schema

Database: PostgreSQL 16 (Railway hosted)
ORM: SQLAlchemy 2.0 (async) + asyncpg
Migrations: Alembic 1.13.2

**PostgreSQL syntax notes vs SQLite:**
- `SERIAL` or `GENERATED ALWAYS AS IDENTITY` instead of `AUTOINCREMENT`
- `TIMESTAMPTZ` instead of `DATETIME`
- `NOW()` instead of `datetime('now')`
- Boolean is native `BOOLEAN` type, not `INTEGER 0/1`
- Alembic manages all schema changes — no manual SQL files

---

### Table: `languages`

Registry of all supported learning languages. **This is the single source of truth for what languages exist.** Adding a new language = inserting one row here. No code changes required.

```sql
CREATE TABLE languages (
    code        TEXT PRIMARY KEY,          -- ISO 639-1 code: 'en', 'es', 'fr', 'de', 'zh', 'ja', 'pt'
    name        TEXT NOT NULL,             -- English name: 'English', 'Spanish', 'French'
    native_name TEXT NOT NULL,             -- Native name: 'English', 'Español', 'Français'
    is_active   INTEGER NOT NULL DEFAULT 0 -- 1 = shown in UI switcher, 0 = seeded but hidden
);

-- v1 seed data:
-- Active (shown in NavBar switcher):
INSERT INTO languages (code, name, native_name, is_active) VALUES
    ('en', 'English',    'English',    1),
    ('es', 'Spanish',    'Español',    1);

-- Pre-seeded (in DB, not shown in UI yet — enable with UPDATE languages SET is_active=1 WHERE code='fr'):
INSERT INTO languages (code, name, native_name, is_active) VALUES
    ('fr', 'French',     'Français',   0),
    ('de', 'German',     'Deutsch',    0),
    ('zh', 'Chinese',    '中文',        0),
    ('ja', 'Japanese',   '日本語',      0),
    ('pt', 'Portuguese', 'Português',  0);
```

**To enable a new language in future:** `UPDATE languages SET is_active = 1 WHERE code = 'fr';` — that's it. No deployment needed.

---

### Table: `articles`

Stores imported articles.

```sql
CREATE TABLE articles (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    title         TEXT NOT NULL,
    content       TEXT NOT NULL,              -- Full plain text of the article
    language_code TEXT NOT NULL DEFAULT 'en'
                  REFERENCES languages(code) ON UPDATE CASCADE,
    word_count    INTEGER NOT NULL DEFAULT 0, -- Computed on import
    source_format TEXT NOT NULL,              -- 'txt' | 'md' | 'pdf' | 'docx' | 'epub' | 'paste'
    created_at    DATETIME NOT NULL DEFAULT (datetime('now')),
    last_read_at  DATETIME,                   -- Updated when user opens article
    scroll_position INTEGER DEFAULT 0        -- Saved scroll offset in pixels
);

CREATE INDEX idx_articles_language ON articles(language_code);
```

---

### Table: `word_definitions`

Cache for Wiktionary API responses. Cache key is `(word, language_code)`. Avoids repeat API calls for any language.

```sql
CREATE TABLE word_definitions (
    id             INTEGER PRIMARY KEY AUTOINCREMENT,
    word           TEXT NOT NULL,               -- Lowercase, normalized
    language_code  TEXT NOT NULL DEFAULT 'en'
                   REFERENCES languages(code) ON UPDATE CASCADE,
    phonetics      TEXT,                        -- IPA string, e.g. "/həˈloʊ/"
    part_of_speech TEXT,                        -- First meaning's part of speech
    definition     TEXT,                        -- First definition text
    example        TEXT,                        -- First example sentence
    synonyms       TEXT,                        -- JSON array of strings: '["hi","hey"]'
    raw_response   TEXT,                        -- Full JSON from API (for future use)
    cached_at      DATETIME NOT NULL DEFAULT (datetime('now')),
    UNIQUE(word, language_code)                 -- One cache entry per (word, language) pair
);

CREATE INDEX idx_word_definitions_word_lang ON word_definitions(word, language_code);
```

---

### Table: `vocabulary`

Words saved by the user from articles or manually.

```sql
CREATE TABLE vocabulary (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    word            TEXT NOT NULL,
    language_code   TEXT NOT NULL DEFAULT 'en'
                    REFERENCES languages(code) ON UPDATE CASCADE,
    definition      TEXT,
    phonetics       TEXT,
    part_of_speech  TEXT,
    example         TEXT,
    notes           TEXT,                     -- User's free-text notes
    tag_id          INTEGER REFERENCES tags(id) ON DELETE SET NULL,
    -- SRS fields (simplified interval scheduling)
    ease_factor     REAL NOT NULL DEFAULT 2.5,
    interval_days   INTEGER NOT NULL DEFAULT 1,
    repetitions     INTEGER NOT NULL DEFAULT 0,
    next_review_at  DATETIME NOT NULL DEFAULT (datetime('now')),
    -- Metadata
    source_article_id INTEGER REFERENCES articles(id) ON DELETE SET NULL,
    created_at      DATETIME NOT NULL DEFAULT (datetime('now')),
    updated_at      DATETIME NOT NULL DEFAULT (datetime('now')),
    UNIQUE(word, language_code)               -- Same word can exist in multiple languages
);

CREATE INDEX idx_vocabulary_next_review ON vocabulary(next_review_at);
CREATE INDEX idx_vocabulary_tag ON vocabulary(tag_id);
CREATE INDEX idx_vocabulary_language ON vocabulary(language_code);
```

---

### Table: `tags`

Predefined tags managed by the user in Settings.

```sql
CREATE TABLE tags (
    id         INTEGER PRIMARY KEY AUTOINCREMENT,
    name       TEXT NOT NULL UNIQUE,          -- e.g. "Important", "Hard"
    created_at DATETIME NOT NULL DEFAULT (datetime('now'))
);

-- Seed default tags on first run:
INSERT INTO tags (name) VALUES ('Important'), ('Hard'), ('Mastered'), ('Review Later');
```

---

### Table: `saves`

Annotations and quotes saved from articles.

```sql
CREATE TABLE saves (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    article_id  INTEGER NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    type        TEXT NOT NULL CHECK(type IN ('annotation', 'quote')),
    saved_text  TEXT NOT NULL,               -- The selected passage
    note        TEXT,                        -- User's annotation note (annotations only)
    char_start  INTEGER,                     -- Character offset in article content
    char_end    INTEGER,                     -- Character offset in article content
    created_at  DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_saves_article ON saves(article_id);
```

---

### Table: `review_logs`

Records each review event for history/stats.

```sql
CREATE TABLE review_logs (
    id            INTEGER PRIMARY KEY AUTOINCREMENT,
    vocabulary_id INTEGER NOT NULL REFERENCES vocabulary(id) ON DELETE CASCADE,
    result        TEXT NOT NULL CHECK(result IN ('known', 'unknown')),
    reviewed_at   DATETIME NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX idx_review_logs_date ON review_logs(reviewed_at);
```

---

### Table: `app_settings`

Key-value store for persistent app settings.

```sql
CREATE TABLE app_settings (
    key   TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Seed defaults:
INSERT INTO app_settings (key, value) VALUES
    ('daily_review_limit', '20');
```

---

## API Endpoints

Base URL: `http://localhost:8000`  
All responses are JSON. All endpoints are unauthenticated.

**Language param convention:** Wherever `language` is a query parameter, it accepts any `code` value from the `languages` table (e.g. `"en"`, `"es"`, `"fr"`). The backend validates it against the `languages` table and returns `422` if the code doesn't exist.

---

### Languages

#### `GET /api/languages`
Returns all languages. By default returns only active ones; pass `?all=true` to include inactive.

**Query params:**
- `all` (optional bool, default false): if true, returns all languages including `is_active=false`

**Response:**
```json
[
  { "code": "en", "name": "English",  "native_name": "English", "is_active": true },
  { "code": "es", "name": "Spanish",  "native_name": "Español",  "is_active": true }
]
```

This endpoint is called by the NavBar to populate the language switcher dynamically. **No frontend code changes are needed when a new language is activated.**

---

### Articles

#### `GET /api/articles`
Returns articles filtered by language, sorted by `created_at` DESC.

**Query params:**
- `language` (required): language code from `languages` table, e.g. `"en"`, `"es"`

**Response:**
```json
[
  {
    "id": 1,
    "title": "The Future of AI",
    "language_code": "en",
    "word_count": 842,
    "source_format": "pdf",
    "created_at": "2026-03-24T10:00:00",
    "last_read_at": "2026-03-24T11:00:00"
  }
]
```

#### `GET /api/articles/{id}`
Returns single article with full content.

**Response:**
```json
{
  "id": 1,
  "title": "The Future of AI",
  "content": "Full article text...",
  "language_code": "en",
  "word_count": 842,
  "source_format": "pdf",
  "created_at": "2026-03-24T10:00:00",
  "last_read_at": null,
  "scroll_position": 0
}
```

#### `POST /api/articles/import`
Import an article from a file or plain text.

**Request:** `multipart/form-data`
- `file` (optional): uploaded file
- `text` (optional): pasted plain text
- `title` (optional): article title
- `language` (optional): language code — if omitted, auto-detected via `langdetect`. User can confirm/override in import modal. Validated against `languages` table.

**Response:** `201 Created`
```json
{ "id": 2, "title": "My Article", "language_code": "es", "word_count": 300 }
```

**Errors:**
- `400` if both `file` and `text` are missing
- `422` if file format not supported or language code not in `languages` table
- `500` if parsing fails

#### `PATCH /api/articles/{id}/scroll`
Save scroll position.

**Request:**
```json
{ "scroll_position": 1240 }
```
**Response:** `200 OK`

---

### Word Definitions

#### `GET /api/definitions/{word}`
Look up a word in the specified language. Checks `(word, language)` cache first, calls API if cache miss.

**Query params:**
- `language` (required): `"en"` or `"es"`

**API called:**
**API called:**
Wiktionary REST API — one endpoint, all languages:
`https://en.wiktionary.org/api/rest_v1/page/definition/{word}`

Parse response to extract entry for the requested `language_code`. **Adding any new language requires zero API changes** — Wiktionary supports them all.

**Response (found):**
```json
{
  "word": "ephemeral",
  "language_code": "en",
  "phonetics": "/ɪˈfem.ər.əl/",
  "part_of_speech": "adjective",
  "definition": "Lasting for a very short time.",
  "example": "Fashions are ephemeral.",
  "synonyms": ["transitory", "fleeting", "momentary"]
}
```

**Response (not found):** `404 Not Found`
```json
{ "detail": "Word not found" }
```

---

### Vocabulary

#### `GET /api/vocabulary`
Returns vocabulary words filtered by language.

**Query params:**
- `language` (required): language code, e.g. `"en"`, `"es"`, `"fr"`
- `tag_id` (optional int): filter by tag
- `search` (optional str): filter by word prefix

**Response:**
```json
[
  {
    "id": 1,
    "word": "ephemeral",
    "language_code": "en",
    "definition": "Lasting for a very short time.",
    "phonetics": "/ɪˈfem.ər.əl/",
    "part_of_speech": "adjective",
    "notes": "seen in NYT article",
    "tag": { "id": 2, "name": "Hard" },
    "next_review_at": "2026-03-27T00:00:00",
    "repetitions": 1,
    "created_at": "2026-03-24T10:00:00"
  }
]
```

#### `POST /api/vocabulary`
Add a word to vocabulary.

**Request:**
```json
{
  "word": "ephemeral",
  "language_code": "en",
  "source_article_id": 1
}
```

**Response:** `201 Created` — returns created vocabulary entry.  
**Error:** `409 Conflict` if `(word, language_code)` pair already exists.

#### `PATCH /api/vocabulary/{id}`
Update notes or tag.

**Request:**
```json
{
  "notes": "Used in chapter 3",
  "tag_id": 2
}
```
**Response:** Updated vocabulary entry.

#### `DELETE /api/vocabulary/{id}`
Delete a word.  
**Response:** `204 No Content`

---

### Review

#### `GET /api/review/due`
Returns words due for review today in the specified language, capped by daily limit setting.

**Query params:**
- `language` (required): language code, e.g. `"en"`, `"es"`, `"fr"`

**Response:**
```json
{
  "count": 8,
  "daily_limit": 20,
  "language_code": "en",
  "cards": [
    {
      "id": 1,
      "word": "ephemeral",
      "language_code": "en",
      "phonetics": "/ɪˈfem.ər.əl/",
      "part_of_speech": "adjective",
      "definition": "Lasting for a very short time.",
      "example": "Fashions are ephemeral.",
      "repetitions": 0,
      "interval_days": 1
    }
  ]
}
```

#### `POST /api/review/{vocabulary_id}/result`
Record a review result and update scheduling.

**Request:**
```json
{ "result": "known" }
```

**Logic:**
- `"known"`:
  - If `repetitions == 0`: `interval_days = 3`
  - Else: `interval_days = min(interval_days * 2, 30)`
  - `repetitions += 1`
  - `next_review_at = now + interval_days`
- `"unknown"`:
  - `interval_days = 1`
  - `repetitions = 0`
  - `next_review_at = tomorrow`

**Response:** `200 OK`
```json
{
  "id": 1,
  "next_review_at": "2026-03-27T00:00:00",
  "interval_days": 3,
  "repetitions": 1
}
```

---

### Saves

#### `GET /api/saves`
Returns all saves.

**Query params:**
- `type` (optional): `"annotation"` | `"quote"`

**Response:**
```json
[
  {
    "id": 1,
    "article_id": 1,
    "article_title": "The Future of AI",
    "type": "quote",
    "saved_text": "Intelligence is not merely computational...",
    "note": null,
    "created_at": "2026-03-24T12:00:00"
  }
]
```

#### `POST /api/saves`
Create a save.

**Request:**
```json
{
  "article_id": 1,
  "type": "annotation",
  "saved_text": "Intelligence is not merely computational...",
  "note": "Great definition to revisit",
  "char_start": 420,
  "char_end": 461
}
```
**Response:** `201 Created`

#### `DELETE /api/saves/{id}`
Delete a save.  
**Response:** `204 No Content`

---

### Tags

#### `GET /api/tags`
Returns all tags.  
**Response:** `[{ "id": 1, "name": "Important" }, ...]`

#### `POST /api/tags`
Create a tag.  
**Request:** `{ "name": "Fascinating" }`  
**Response:** `201 Created`

#### `PATCH /api/tags/{id}`
Rename a tag.  
**Request:** `{ "name": "Very Hard" }`  
**Response:** Updated tag.

#### `DELETE /api/tags/{id}`
Delete a tag. Affected vocabulary words have `tag_id` set to NULL.  
**Response:** `204 No Content`

---

### Settings

#### `GET /api/settings`
Returns all settings as key-value pairs.  
**Response:** `{ "daily_review_limit": "20" }`

#### `PATCH /api/settings`
Update one or more settings.  
**Request:** `{ "daily_review_limit": "30" }`  
**Response:** Updated settings object.

---

### Dashboard

#### `GET /api/dashboard`
Returns all stats needed for the Dashboard page in one call, filtered by language.

**Query params:**
- `language` (required): language code, e.g. `"en"`, `"es"`

**Response:**
```json
{
  "language_code": "en",
  "total_articles": 12,
  "total_vocabulary": 87,
  "due_today": 8,
  "reviewed_today": 3,
  "recent_articles": [
    {
      "id": 5,
      "title": "The Future of AI",
      "language_code": "en",
      "last_read_at": "2026-03-24T11:00:00"
    }
  ]
}
```

---

### Export

#### `GET /api/export/vocabulary`
Returns vocabulary as a CSV file download, filtered by language.

**Query params:**
- `language` (optional): language code — if omitted, exports all languages

**Response:** `Content-Type: text/csv`
**Filename:** `polyglot_vocabulary_{language}.csv`
**Columns:** `word,language_code,definition,part_of_speech,phonetics,tag,notes,date_saved`

---

### Notifications (Phase 2 — Android only)

#### `POST /api/notifications/register`
Register a device FCM token. Called by the Android app on launch.

**Request:**
```json
{ "fcm_token": "dEoR..." }
```
**Response:** `200 OK`

#### `POST /api/notifications/send-daily`
Trigger daily review reminder. Called by a scheduled job (Railway cron or manual trigger).
Sends FCM push to all registered tokens where due card count > 0.

**Response:**
```json
{ "sent": 1, "skipped": 0 }
```

#### `DELETE /api/notifications/unregister`
Remove a device token (called on app uninstall or logout).

**Request:** `{ "fcm_token": "dEoR..." }`
**Response:** `204 No Content`

---

## Services

### `services/file_parser.py`

```python
async def parse_file(filename: str, content: bytes) -> str:
    """
    Accepts filename and raw bytes.
    Returns extracted plain text.
    Raises ValueError for unsupported formats.
    Raises RuntimeError if parsing fails.
    """
```

Dispatch table:
- `.txt`, `.md` → decode as UTF-8
- `.pdf` → `pdfplumber.open()` → extract text from all pages
- `.docx` → `python-docx Document()` → join all paragraphs
- `.epub` → `ebooklib` + `BeautifulSoup` → extract text from all items

### `services/language_detector.py`

```python
def detect_language(text: str, db_languages: list[str]) -> str:
    """
    Detects language of text content.
    Returns a language_code that exists in the languages table.
    Falls back to 'en' if detection is inconclusive or result not in db_languages.
    Uses langdetect library. Samples first 500 chars for speed.

    db_languages: list of active language codes from DB (e.g. ['en', 'es'])
    This ensures detected language is always a valid FK value.
    """
```

### `services/dictionary.py`

```python
async def lookup_word(word: str, language_code: str, db: AsyncSession) -> WordDefinitionSchema | None:
    """
    1. Normalize word to lowercase, strip punctuation
    2. Check word_definitions table for (word, language_code) pair
    3. If found: return cached result
    4. If not found: call Wiktionary REST API
       URL: https://en.wiktionary.org/api/rest_v1/page/definition/{word}
       Parse response to extract entry matching language_code
       - Success: store in cache with language_code, return result
       - Not found / parse error: return None (silent fail)

    NOTE: Wiktionary supports all languages via one endpoint.
    No code changes needed when new languages are added to the languages table.
    """
```

### `services/push.py`

```python
async def send_daily_reminder(db: AsyncSession) -> dict:
    """
    Phase 2 only — Android push notifications.
    1. Query all registered FCM tokens from device_tokens table
    2. For each token, check if due_today > 0
    3. Send FCM push via firebase-admin SDK
    4. Returns { sent: int, skipped: int }
    """
```

**`device_tokens` table** (Phase 2 addition):
```sql
CREATE TABLE device_tokens (
    id         SERIAL PRIMARY KEY,
    fcm_token  TEXT NOT NULL UNIQUE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
```

```python
async def export_vocabulary_csv(db: AsyncSession, language_code: str | None = None) -> str:
    """
    Queries vocabulary with tag join.
    If language_code provided, filters to that language only.
    If language_code is None, exports all words from all languages.
    Returns CSV string.
    Columns: word,language_code,definition,part_of_speech,phonetics,tag,notes,date_saved
    """
```

---

## CORS Configuration

```python
# main.py
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",          # local dev
        "https://*.vercel.app",           # Vercel preview/prod
        "capacitor://localhost",          # Capacitor Android (Phase 2)
        "http://localhost",               # Capacitor fallback
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

---

## Error Handling Convention

All errors return:
```json
{ "detail": "Human-readable error message" }
```

| HTTP Code | Meaning |
|-----------|---------|
| 200 | OK |
| 201 | Created |
| 204 | No Content (delete) |
| 400 | Bad Request (missing params) |
| 404 | Not Found |
| 409 | Conflict (duplicate word) |
| 422 | Validation Error (FastAPI default) |
| 500 | Internal Server Error |
