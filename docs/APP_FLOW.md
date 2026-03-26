# APP_FLOW.md — Polyglot Application Flow

**Version:** 2.0  
**Date:** 2026-03-24

---

## Screen Inventory

| Route | Page Name | Description |
|-------|-----------|-------------|
| `/` | Dashboard | Stats + quick navigation |
| `/articles` | Article List | Import + browse articles |
| `/articles/[id]` | Article Reader | Read + click words |
| `/vocabulary` | Vocabulary | Manage saved words |
| `/review` | Review | Flashcard review session |
| `/saves` | Saves | Annotations + quotes |
| `/settings` | Settings | App configuration |

---

## Global Navigation

**NavBar** is present on all pages. Contains:
- Logo / "Polyglot" brand mark (links to `/`)
- Nav links: Articles · Vocabulary · Review · Saves · Settings
- Active link is visually highlighted

**No authentication.** App opens directly to Dashboard.

---

## Flow 1: First Launch

```
User opens app
  → Dashboard loads
  → Stats show: 0 articles, 0 words, 0 reviews
  → Empty state message: "Import your first article to get started"
  → CTA button: "Import Article" → navigates to /articles
```

---

## Flow 2: Import an Article

```
User is on /articles
  → Sees article list (empty or populated)
  → Clicks "Import Article" button
  → Import modal opens

  BRANCH A — File Upload:
    → User drags or clicks to upload a file
    → Accepted formats: .txt .md .pdf .docx .epub
    → File selected → filename shown in modal
    → User clicks "Import"
    → Backend parses file:
        SUCCESS → article saved to DB → modal closes → article appears in list
        FAILURE (parse error) → error message shown in modal → modal stays open

  BRANCH B — Paste Text:
    → User clicks "Paste Text" tab in modal
    → Text area appears
    → User pastes or types text
    → User enters optional title (default: first 60 chars of text)
    → User clicks "Import"
    → Backend saves text directly
        SUCCESS → article saved → modal closes → article appears in list
        FAILURE (empty text) → validation error shown inline

  After successful import:
    → New article card appears at top of list
    → Dashboard stats update (article count +1)
```

---

## Flow 3: Read an Article

```
User is on /articles
  → Clicks on an article card
  → Navigates to /articles/[id]
  → Article text renders with paragraph breaks
  → Already-saved words are highlighted in green

  User clicks a word:
    BRANCH A — Word found in cache (word_definitions table):
      → WordCard appears immediately (< 200ms)

    BRANCH B — Word not in cache, API call made:
      → Loading indicator on word
      → API responds (< 2s):
          SUCCESS → WordCard appears, result cached in DB
          FAILURE (404 / network error) → nothing happens (silent fail)

  WordCard is open:
    → Shows: word, phonetics, part of speech, definition, example, synonyms
    → "Save to Vocabulary" button visible
        IF word already saved: button shows "Saved ✓" (disabled)
        IF word not saved: button is active

    User clicks "Save to Vocabulary":
      → Word saved to vocabulary table
      → Button changes to "Saved ✓"
      → Word in article text changes to highlighted state
      → WordCard stays open

    User closes WordCard:
      OPTION A: clicks outside the card
      OPTION B: presses Escape key
      → WordCard disappears

  User selects a passage of text (click + drag):
    → Context menu appears near selection with two options:
        "✏ Annotate" | "❝ Quote"

    User clicks "Quote":
      → Selection saved to saves table (type: quote)
      → Context menu disappears
      → Brief confirmation toast: "Quote saved"

    User clicks "Annotate":
      → Small input popup appears near selection
      → User types a note (optional)
      → User clicks "Save Annotation"
          SUCCESS → saved to DB → popup closes → toast: "Annotation saved"
      → User clicks "Cancel" → popup closes, nothing saved

  User scrolls / reads:
    → Scroll position saved periodically (every 5s or on scroll end)
    → Next time user opens same article, scroll position restored
```

---

## Flow 4: Manage Vocabulary

```
User is on /vocabulary
  → Sees list of all saved words
  → Default view: all words, sorted by date saved (newest first)

  Filter by tag:
    → User clicks a tag chip (Important / Hard / Mastered / Review Later)
    → List filters to show only words with that tag
    → Click again or click "All" to reset

  Search:
    → User types in search box
    → List filters in real time (client-side, by word)

  Per-word actions:
    User clicks tag dropdown on a word:
      → Dropdown shows predefined tags + "None"
      → User selects tag → saved immediately, row updates

    User clicks notes field on a word:
      → Inline edit activates (or modal opens)
      → User types note → clicks "Save" or presses Enter
      → Note saved to DB, row updates

    User clicks delete (trash icon) on a word:
      → Confirmation prompt: "Delete [word]?"
      → User confirms → word deleted from DB → row removed from list
      → User cancels → nothing happens

  Manual add word:
    → User clicks "Add Word" button
    → Modal opens with: word input, optional notes, optional tag
    → User types word → definition auto-fetched from API (same as WordCard)
        API SUCCESS → definition shown in modal for preview
        API FAILURE → user can still save, definition stored as empty
    → User clicks "Add" → word saved → modal closes → word appears in list
```

---

## Flow 5: Review Session

```
User is on /review (or clicks "Start Review" from Dashboard)

  ENTRY STATE:
    → Page shows: "X words due for review today"
    → If X = 0: empty state "No cards due today. Come back tomorrow! 🎉"
    → If X > 0: "Start Review" button visible

  User clicks "Start Review":
    → Session begins
    → Queue built: all words where next_review_at <= today, capped at daily_limit (from settings)
    → Progress indicator shown: "Card 1 of X"

  For each card:
    FRONT OF CARD:
      → Word displayed (large)
      → Instruction: "Press Space or click to reveal"

    User flips card (Space / click):
      BACK OF CARD:
        → Phonetics
        → Part of speech
        → Definition
        → Example sentence
        → Two buttons: "Know it ✓" | "Don't know ✗"

    User clicks "Know it":
      → next_review_at = today + current interval (doubled each time, min 3 days, max 30 days)
      → repetitions += 1
      → Next card loads

    User clicks "Don't know":
      → next_review_at = tomorrow
      → repetitions = 0
      → interval_days = 1
      → Next card loads

  After last card:
    SUMMARY SCREEN:
      → "Review Complete!"
      → "Known: X | Unknown: Y"
      → Button: "Back to Dashboard" → navigates to /
      → Button: "Review Again" → restarts session with only "Don't know" cards
```

---

## Flow 6: Saves Page

```
User is on /saves

  → Sees list of all saves (annotations + quotes combined)
  → Sorted by date saved, newest first
  → Each save shows: saved text, source article title (linked), type badge, date

  Filter by type:
    → "All" | "Annotations" | "Quotes" tabs/chips
    → Clicking filters the list

  User clicks article title in a save:
    → Navigates to /articles/[id] for that article

  User deletes a save:
    → Clicks delete icon
    → Confirmation: "Delete this save?"
    → User confirms → deleted from DB → removed from list
    → User cancels → nothing happens

  Empty state:
    → "No saves yet. Select text while reading to create quotes and annotations."
```

---

## Flow 7: Settings

```
User is on /settings
  → Page divided into sections: Display, Review, Tags, Data

  Display section:
    Font size toggle (Small / Medium / Large):
      → Change applies immediately to article reading font size
      → Preference stored in localStorage

    Language toggle (English / 中文):
      → All UI labels switch immediately
      → Preference stored in localStorage

  Review section:
    Daily limit input:
      → User changes number → saved to localStorage on blur/change
      → Takes effect next review session

  Tags section:
    → List of existing predefined tags shown
    → User clicks "+ Add Tag" → text input appears inline → user types → presses Enter or clicks "Add"
        SUCCESS → tag saved to DB → appears in list immediately
    → User clicks edit icon on tag → inline edit → Enter to save
    → User clicks delete icon on tag:
        → Confirmation: "Delete tag '[name]'? Words with this tag will become untagged."
        → User confirms → tag deleted, affected words set to null tag
        → User cancels → nothing happens

  Data section:
    → "Export Vocabulary as CSV" button
    → User clicks → browser downloads file: polyglot_vocabulary.csv
    → CSV columns: word, definition, part_of_speech, phonetics, tag, notes, date_saved
```

---

## Error States (Global)

| Situation | Behavior |
|-----------|----------|
| Backend unreachable | Show banner: "Backend offline. Some features unavailable." localStorage fallback active |
| Free Dictionary API down | WordCard silently fails to open |
| File parse failure | Error shown in import modal, import cancelled |
| Empty vocabulary | Review page shows empty state, no crash |
| Network timeout (>5s) | Loading state with retry button |

---

## Navigation Flow Diagram

```
Dashboard (/)
├── → /articles (from nav or CTA)
│     └── → /articles/[id] (click article)
│           ├── WordCard (inline popup)
│           ├── Save to Vocabulary → /vocabulary
│           └── Annotate/Quote → /saves
├── → /vocabulary (from nav)
│     └── Tag/Notes/Delete actions (in-page)
├── → /review (from nav or dashboard CTA)
│     └── Session → Summary → back to /
├── → /saves (from nav)
│     └── Click article link → /articles/[id]
└── → /settings (from nav)
```
