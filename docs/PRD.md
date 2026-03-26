# PRD.md — Polyglot Product Requirements Document

**Version:** 2.3 (+ Capacitor Android + PostgreSQL + cloud sync)
**Date:** 2026-03-24
**Owner:** Carlos
**Status:** Approved for implementation

---

## 1. Product Overview

### 1.1 What Is Polyglot?
Polyglot is a personal language reading and vocabulary learning application supporting **English and Spanish** (extensible to any language). It runs as a **web app** (Next.js on Vercel) and as an **Android app** (same codebase packaged with Capacitor). The core workflow: select a learning language → import articles → read and click words for definitions → save unknown words → review with flashcards.

### 1.1.1 Language System
- **Learning language**: the language being studied. Controls which articles, vocabulary, and review cards are shown.
- **UI language**: English only in v1. (中文 / Español UI labels are v2.)
- **Single global switch**: one toggle in the NavBar controls the active learning language. Switching immediately filters all content.
- **Both/all languages coexist** in the database. No data is lost when switching.
- **Extensible by design**: adding a new language requires only inserting one row into the `languages` database table — no code changes needed.
- **v1 pre-seeded languages**: EN and ES active. FR, DE, ZH, JA, PT pre-seeded inactive.

### 1.1.2 Platform Strategy
- **Phase 1 (v1):** Web app only. Fully responsive, works in mobile browser. Backend on Railway + PostgreSQL.
- **Phase 2 (v2):** Same Next.js codebase packaged into Android APK via Capacitor. Adds: OCR camera import, FCM push notifications, offline reading.
- **Future:** iOS via Capacitor (same code, different build target).
- **One backend** serves both web and Android.

### 1.2 Who Is It For?
**Single user: Carlos only.** No authentication, no multi-user system, no registration or login.

### 1.3 Inspiration
ReadEra (reading interface), Anki (spaced repetition), standard vocabulary learning apps.

### 1.4 What "Done" Means (Phase 1 — Web)
All 7 pages functional, EN+ES language switching works, all API integrations work, database persists to PostgreSQL, frontend deploys to Vercel, backend deploys to Railway.

### 1.5 What "Done" Means (Phase 2 — Android)
Android APK builds successfully from the same Next.js codebase via Capacitor. OCR import works on device. FCM push notifications deliver daily review reminders. Offline reading works for previously loaded articles.

---

## 2. Pages & Features

### Page 1: Home / Dashboard (`/`)
**Purpose:** At-a-glance overview and quick navigation hub.

**Must include:**
- Total articles imported (count, **filtered by active learning language**)
- Total words in vocabulary list (count, **filtered by active learning language**)
- Total words reviewed today (count, **filtered by active learning language**)
- Today's due-for-review word count with a CTA button → `/review`
- 3 most recently read articles as clickable cards → `/articles/[id]` (**filtered by active learning language**)
- Navigation links to all major sections
- **Language switcher in NavBar** (EN / ES toggle — always visible)

**Success criteria:**
- Stats load from the database on every visit
- "Due today" count is accurate (words where `next_review_at <= now`)
- Recent articles show title and last-read timestamp
- All stats update in real time after actions in other pages

**Non-goals:** No charts, no streaks, no calendar heatmap (v2).

---

### Page 2: Article List (`/articles`)
**Purpose:** Import new articles and browse existing ones.

**Must include:**
- List of articles **filtered by active learning language** (title, date imported, word count)
- Language badge on each article card (EN / ES)
- Import button that opens a modal/drawer
- Import modal supports: file upload (.txt, .md, .pdf, .docx, .epub) AND paste plain text
- **Language is auto-detected on import** (heuristic: detect from text content) OR user can manually confirm/override in import modal
- Each article card links to `/articles/[id]`
- Articles are read-only (no edit title, no delete in v1)

**File parsing requirements:**
- `.txt` / `.md`: read as plain text
- `.pdf`: extract text using `pdfplumber` (Python)
- `.docx`: extract text using `python-docx`
- `.epub`: extract text using `ebooklib`
- All formats: strip formatting, store as plain text in DB

**Success criteria:**
- All 5 file formats successfully parse and store text
- Paste text import works without a file
- Article language is detected or set correctly on import
- Article appears in list only when its language matches active learning language
- Empty state shown when no articles exist for the active language

**Non-goals:** No article deletion, no title editing, no URL scraping (v2).

---

### Page 3: Article Reading Page (`/articles/[id]`)
**Purpose:** Read an article and look up words by clicking them.

**Must include:**
- Full article text rendered with paragraph breaks preserved
- Every word is individually clickable (tokenized)
- Clicking a word opens a WordCard popup/panel
- Words already saved to vocabulary are visually highlighted (different color)
- Reading progress is saved (scroll position or paragraph position)

**WordCard must show:**
- The word (large, prominent)
- Phonetics / IPA pronunciation
- Part of speech (noun, verb, adj, etc.)
- English definition(s) — from Free Dictionary API
- Example sentence(s)
- Synonyms (if available)
- "Save to Vocabulary" button
- If word already saved: show "Saved ✓" state instead

**WordCard behavior:**
- Data fetched from Free Dictionary API:
  - English: `https://api.dictionaryapi.dev/api/v2/entries/en/{word}`
  - Spanish: `https://api.dictionaryapi.dev/api/v2/entries/es/{word}`
- Results cached in `word_definitions` table — cache key is `(word, language)`
- If API returns 404 or any error: WordCard does NOT appear (silent failure — same for both languages)
- WordCard closes when clicking outside it or pressing Escape

**Success criteria:**
- Clicking any word triggers a definition lookup
- WordCard appears within 500ms (from cache) or 2s (from API)
- Saving a word changes its visual state on the page immediately
- Already-saved words are highlighted before any click

**Non-goals:** No text highlighting/annotation on the reading page (that's the Saves page). No audio pronunciation playback (v2).

---

### Page 4: Vocabulary List (`/vocabulary`)
**Purpose:** Review and manage all saved words.

**Must include:**
- Table/grid of vocabulary words **filtered by active learning language**
- Each row shows: word, part of speech, short definition, tag(s), date saved
- Filter by tag (dropdown or chip filter)
- Search by word (text input, client-side filter)
- Actions per word: Delete, Edit notes, Assign/change tag
- Manual add: a form to add a word without going through an article (language defaults to active learning language)
- Pagination or virtual scroll if list is long (>50 words)

**Tags system:**
- Predefined tags only: "Important", "Hard", "Mastered", "Review Later"
- User can manage (add/edit/delete) predefined tags in Settings
- Each word can have one tag (or none)

**Notes field:**
- Free-text notes per word, editable inline or via modal
- Stored in `vocabulary.notes` column

**Success criteria:**
- All CRUD operations (create, read, update tag/notes, delete) work
- Filter by tag narrows the list correctly
- Search filters in real time as user types
- Manual add saves the word with a definition lookup
- Empty state shown when no words saved

**Non-goals:** No bulk operations, no export from this page (export is in Settings), no sorting (v2).

---

### Page 5: Review (`/review`)
**Purpose:** Flashcard review of saved vocabulary.

**Mode:** Flashcard only (flip card — front: word, back: definition + example).

**Flow:**
1. User arrives at `/review`
2. Shows count of due cards today (**filtered by active learning language**)
3. User clicks "Start Review"
4. Cards presented one at a time (only words matching active learning language)
5. Front: the word
6. User clicks card or presses Space to flip
7. Back: phonetics, part of speech, definition, example sentence
8. Two buttons: "Know it ✓" and "Don't know ✗"
9. "Know it" → interval increases, `next_review_at` pushed forward (simplified: +3 days if first time, double interval each subsequent time, max 30 days)
10. "Don't know" → `next_review_at` reset to tomorrow, `repetitions` reset to 0
11. After all cards reviewed: summary screen (X known, Y unknown)
12. Summary screen has button back to Dashboard

**Success criteria:**
- Only words where `next_review_at <= today` are shown
- Review session shows accurate count upfront
- Interval update logic is applied correctly on each answer
- Session summary shows correct counts
- Empty state ("No cards due today") when nothing is due

**Non-goals:** No spelling, fill-in-the-blank, or sentence modes. No SM-2 scoring 0-5 (v2). No audio.

---

### Page 6: Saves (`/saves`)
**Purpose:** View all saved annotations and quotes from articles.

**Two content types (displayed in one unified page):**
1. **Annotations**: A highlighted phrase/sentence from an article + optional user note
2. **Quotes**: A saved passage from an article (no note required)

**Must include:**
- List of all saves, sorted by most recent
- Each save shows: the saved text, source article title (linked), type badge (Annotation / Quote), date saved
- Filter by type (All / Annotations / Quotes)
- Delete individual saves
- Clicking article title navigates to that article

**How saves are created (from reading page):**
- User selects text in the article → context menu appears with "Annotate" and "Quote" options
- "Annotate" → opens a small input to add a note, then saves
- "Quote" → saves immediately with no note

**Success criteria:**
- Text selection triggers the context menu correctly
- Saves persist in the database
- Saves page lists all saves with correct metadata
- Delete works immediately

**Non-goals:** No edit of saved text (only notes). No export of saves (v2). No tags on saves.

---

### Page 7: Settings (`/settings`)
**Purpose:** Configure app behavior and manage data.

**Sections:**

**Display:**
- Font size: Small / Medium / Large (applied globally to article reading text)

**Note on language switching:** The learning language (EN/ES) is controlled by the NavBar switcher, not Settings. UI language (interface labels) is English only in v1; 中文 and Español UI are v2.

**Review:**
- Daily review limit: number input (default: 20, min: 1, max: 100)
- This caps how many cards appear in a review session

**Tags:**
- List of all predefined tags
- Add new tag (text input + Add button)
- Delete existing tag (with confirmation)
- Edit tag name (inline edit)

**Data:**
- Export vocabulary as CSV button (downloads `polyglot_vocabulary.csv`)
- CSV columns: word, definition, part_of_speech, phonetics, tag, notes, date_saved

**Success criteria:**
- Font size change applies immediately without reload
- Daily review limit is respected in the review page
- Tag CRUD operations reflect immediately in vocabulary page
- CSV export downloads correctly with all columns (includes `language` column)

**Non-goals:** No theme switching (dark mode is v2). No import of data. No LibreTranslate (Chinese translation is v2). No UI language switching in Settings (language switcher is NavBar only).

---

## 3. Phase 2 Features (Android via Capacitor — built after Phase 1 web is complete)

### 3.1 OCR Camera Import
- User opens Import modal on Android → taps "Scan with Camera"
- `@capacitor/camera` opens native camera
- Photo captured → Tesseract.js runs OCR in-browser → extracted text appears in paste text field
- User confirms/edits → imports as normal article
- **Success criteria:** Photo of a printed page → text extracted with reasonable accuracy → importable as article

### 3.2 Push Notifications (FCM)
- Firebase Cloud Messaging integration
- Backend sends daily push at user-configured time if there are due cards
- User taps notification → app opens directly to `/review`
- **Success criteria:** Notification delivered to Android device when cards are due. Tap navigates to review.

### 3.3 Offline Reading
- Previously opened articles cached via Capacitor Preferences / local storage
- User can read cached articles without internet connection
- Word definitions from cache still available offline
- Vocabulary saves queued offline → synced when connection restored
- **Success criteria:** Airplane mode → previously read article still readable. Saved words sync after reconnect.

---

## 4. What Is Explicitly Out of Scope (v1 web)

- User authentication / login / registration
- Multi-user support
- Chinese translation of definitions (LibreTranslate — v2)
- UI language switching (中文 / Español interface labels — v2)
- Activating pre-seeded languages beyond EN and ES (one-row DB update when ready)
- Dark mode / theme switching
- Audio pronunciation playback
- SM-2 full scoring (0–5 quality grades)
- Article deletion or title editing
- URL scraping / web import
- Spelling, fill-in-blank, or sentence review modes
- Bulk vocabulary operations
- Charts / streak tracking on dashboard
- iOS build (Phase 3 — same Capacitor code, different build target)
- OCR, push notifications, offline (Phase 2 Android features, not Phase 1 web)

---

## 5. User Stories

| ID | Phase | Story | Acceptance Criteria |
|----|-------|-------|---------------------|
| US-01 | 1 | Import a PDF article | File uploads, text extracted, article in list |
| US-02 | 1 | Click a word to see its definition | WordCard appears within 2s |
| US-03 | 1 | Save an unknown word to vocabulary | Word saved, highlighted, appears in /vocabulary |
| US-04 | 1 | Review due vocabulary with flashcards | Cards flip, interval updates after answer |
| US-05 | 1 | Tag words as "Hard" or "Important" | Tag assigned, filterable |
| US-06 | 1 | Save a quote from an article | Text selection → saved → appears in /saves |
| US-07 | 1 | Export vocabulary as CSV | Downloads with all fields including language |
| US-08 | 1 | See stats on dashboard | Accurate counts filtered by active language |
| US-09 | 1 | Switch from English to Spanish learning | NavBar toggle switches all content |
| US-10 | 1 | English and Spanish vocabulary kept separate | List shows only active language words |
| US-11 | 2 | Scan a printed text with camera to import | Photo → OCR → article imported |
| US-12 | 2 | Receive daily review reminder notification | FCM notification delivered, tap opens /review |
| US-13 | 2 | Read articles offline | Cached articles readable without internet |
| US-14 | 2 | Vocabulary saves sync after reconnect | Offline saves queued and synced |

---

## 6. Success Metrics

**Phase 1 (Web):**
- All 7 pages render without errors
- All 5 file formats parse successfully
- Wiktionary API works for EN and ES (with per-language caching)
- Language switch in NavBar immediately filters all content
- Flashcard review updates intervals correctly
- App fully usable on 375px-wide mobile screen
- Frontend deployed on Vercel, backend deployed on Railway with PostgreSQL

**Phase 2 (Android):**
- APK builds and installs on Android device
- OCR extracts readable text from a printed page photo
- FCM notification delivered when cards are due
- Offline reading works for cached articles
- Data syncs correctly between web and Android via shared backend
