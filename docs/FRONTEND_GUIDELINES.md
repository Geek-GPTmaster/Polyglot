# FRONTEND_GUIDELINES.md — Polyglot Design System

**Version:** 2.0  
**Date:** 2026-03-24  
**Rule:** Every visual decision is locked here. No arbitrary color or spacing choices in components.

---

## Design Philosophy

Polyglot uses a **paper-and-ink aesthetic** — warm, analog, literary. The app should feel like reading a physical book with bookmarks and margin notes. Not clinical, not techy. Calm and focused.

**Core principles:**
- Warmth over coldness (warm whites, not pure white)
- Ink over neon (dark greens and browns, not electric colors)
- Texture over flatness (subtle paper grain)
- Reading comfort above all else

---

## Typography

### Font Families

```css
/* Loaded via Google Fonts in layout.tsx */
--font-serif: 'EB Garamond', Georgia, serif;          /* Article body text, headings */
--font-serif-alt: 'Lora', Georgia, serif;              /* WordCard, vocabulary entries */
--font-sans: 'DM Sans', system-ui, sans-serif;         /* UI labels, buttons, nav */
--font-mono: 'JetBrains Mono', monospace;              /* Phonetics / IPA */
```

### Font Sizes

```css
--text-xs: 0.75rem;      /* 12px — meta labels, timestamps */
--text-sm: 0.875rem;     /* 14px — tags, captions */
--text-base: 1rem;       /* 16px — default body */
--text-md: 1.125rem;     /* 18px — vocabulary list words */
--text-lg: 1.25rem;      /* 20px — section headings */
--text-xl: 1.5rem;       /* 24px — page titles */
--text-2xl: 2rem;        /* 32px — flashcard word (front) */
--text-3xl: 2.5rem;      /* 40px — dashboard stat numbers */
```

### Article Reading Font Size (user-adjustable in Settings)

```css
/* Applied via data-font-size attribute on <body> */
body[data-font-size="small"]  { --article-font-size: 1rem; --article-line-height: 1.7; }
body[data-font-size="medium"] { --article-font-size: 1.2rem; --article-line-height: 1.8; }  /* default */
body[data-font-size="large"]  { --article-font-size: 1.45rem; --article-line-height: 1.9; }
```

### Font Weights

```css
--font-regular: 400;
--font-medium: 500;
--font-semibold: 600;
--font-bold: 700;
```

### Line Heights

```css
--leading-tight: 1.3;
--leading-normal: 1.6;
--leading-relaxed: 1.8;
--leading-loose: 2.0;
```

---

## Color Palette

### Base Colors (CSS Variables)

```css
:root {
  /* Paper tones */
  --color-paper:        #F7F3EC;   /* Main background — warm off-white */
  --color-paper-dark:   #EDE8DF;   /* Card backgrounds, elevated surfaces */
  --color-paper-darker: #E0D9CE;   /* Borders, dividers */

  /* Ink tones */
  --color-ink:          #2C2416;   /* Primary text — very dark warm brown */
  --color-ink-light:    #6B5E4E;   /* Secondary text, meta info */
  --color-ink-faint:    #A89880;   /* Placeholder text, disabled */

  /* Accent — forest green (primary action color) */
  --color-accent:       #4A7C59;   /* Primary buttons, links, highlights */
  --color-accent-light: #6A9E75;   /* Hover state of accent */
  --color-accent-faint: #D4E8D8;   /* Saved word highlight background */
  --color-accent-dark:  #2F5438;   /* Active/pressed accent state */

  /* Status colors */
  --color-success:      #4A7C59;   /* Same as accent — "Known" in review */
  --color-error:        #9B3A2E;   /* "Don't know" in review, delete actions */
  --color-error-light:  #F2DDD9;   /* Error background */
  --color-warning:      #A67C3D;   /* Warning states */

  /* Shadows */
  --shadow-sm: 0 1px 3px rgba(44, 36, 22, 0.08);
  --shadow-md: 0 4px 12px rgba(44, 36, 22, 0.12);
  --shadow-lg: 0 8px 24px rgba(44, 36, 22, 0.16);
  --shadow-card: 0 2px 8px rgba(44, 36, 22, 0.10), 0 0 0 1px rgba(44, 36, 22, 0.06);
}
```

### Color Usage Rules

| Element | Color Token |
|---------|-------------|
| Page background | `--color-paper` |
| Card / panel background | `--color-paper-dark` |
| Borders, dividers | `--color-paper-darker` |
| Primary body text | `--color-ink` |
| Secondary text (dates, meta) | `--color-ink-light` |
| Placeholder / disabled | `--color-ink-faint` |
| Primary buttons | `--color-accent` bg, white text |
| Primary button hover | `--color-accent-light` bg |
| Text links | `--color-accent` |
| Saved word highlight | `--color-accent-faint` bg |
| "Know it" button | `--color-accent` |
| "Don't know" button | `--color-error` |
| Delete actions | `--color-error` |
| NavBar background | `--color-paper-dark` |
| Modal overlay | `rgba(44, 36, 22, 0.5)` |

---

## Spacing System

All spacing uses multiples of 4px.

```css
--space-1:  0.25rem;   /* 4px */
--space-2:  0.5rem;    /* 8px */
--space-3:  0.75rem;   /* 12px */
--space-4:  1rem;      /* 16px */
--space-5:  1.25rem;   /* 20px */
--space-6:  1.5rem;    /* 24px */
--space-8:  2rem;      /* 32px */
--space-10: 2.5rem;    /* 40px */
--space-12: 3rem;      /* 48px */
--space-16: 4rem;      /* 64px */
--space-20: 5rem;      /* 80px */
```

---

## Border Radius

```css
--radius-sm:   4px;
--radius-md:   8px;
--radius-lg:   12px;
--radius-xl:   16px;
--radius-full: 9999px;  /* Pills, tags */
```

---

## Layout

### Page Layout

```
┌─────────────────────────────────────┐
│  NavBar (fixed top, height: 56px)   │
├─────────────────────────────────────┤
│                                     │
│  Page Content                       │
│  max-width: 1200px                  │
│  margin: 0 auto                     │
│  padding: 32px 24px (desktop)       │
│  padding: 16px (mobile)             │
│                                     │
└─────────────────────────────────────┘
```

### Content Width Constraints

```css
--max-width-content:  1200px;   /* Main page container */
--max-width-article:  720px;    /* Article reading text column */
--max-width-narrow:   480px;    /* Modals, forms */
```

### Responsive Breakpoints

```css
/* Mobile-first approach */
--bp-sm:  640px;    /* Small tablets */
--bp-md:  768px;    /* Tablets */
--bp-lg:  1024px;   /* Small desktop */
--bp-xl:  1280px;   /* Large desktop */
```

**Grid behavior:**
- Dashboard stats: 1 col (mobile) → 3 cols (desktop)
- Article list: 1 col (mobile) → 2 cols (tablet) → 3 cols (desktop)
- Vocabulary table: scrollable table (mobile) → full table (desktop)
- NavBar: hamburger menu (mobile < 768px) → full links (desktop)

---

## Component Specifications

### NavBar

```
Height: 56px
Background: var(--color-paper-dark)
Border-bottom: 1px solid var(--color-paper-darker)
Box-shadow: var(--shadow-sm)
Position: sticky top-0, z-index: 100

Logo: font-family var(--font-serif), font-size var(--text-lg), color var(--color-ink)
Nav links: font-family var(--font-sans), font-size var(--text-sm), font-weight var(--font-medium)
Active link: color var(--color-accent), border-bottom: 2px solid var(--color-accent)
Inactive link: color var(--color-ink-light)
Link hover: color var(--color-ink)

Language switcher (always visible, right side of NavBar):
  - Fetched dynamically from GET /api/languages (active only)
  - Renders one pill button per active language using native_name
  - Example with EN+ES active: [English] [Español]
  - Example after FR activated: [English] [Español] [Français] — NO code change needed
  - Active language: background var(--color-accent), color white, border-radius var(--radius-full)
  - Inactive language: background transparent, color var(--color-ink-light)
  - Padding: var(--space-1) var(--space-3)
  - Font: var(--font-sans), var(--text-xs), var(--font-semibold)
  - On switch: saves language_code to localStorage under key 'polyglot_active_language'
              triggers global re-fetch via LanguageContext
  - On mobile: switcher stays visible in hamburger menu header area
  - If only one active language: switcher still renders (single pill, no toggle needed)
```

### Cards (Article Cards, Save Cards)

```
Background: var(--color-paper-dark)
Border: 1px solid var(--color-paper-darker)
Border-radius: var(--radius-lg)
Box-shadow: var(--shadow-card)
Padding: var(--space-6)
Hover: box-shadow var(--shadow-md), translateY(-1px), transition 150ms ease
```

### Buttons

**Primary Button:**
```
Background: var(--color-accent)
Color: white
Font: var(--font-sans), var(--text-sm), var(--font-semibold)
Padding: var(--space-3) var(--space-6)
Border-radius: var(--radius-md)
Hover: background var(--color-accent-light)
Active: background var(--color-accent-dark)
Transition: all 150ms ease
```

**Secondary Button:**
```
Background: transparent
Color: var(--color-ink)
Border: 1px solid var(--color-paper-darker)
Same padding and radius as Primary
Hover: background var(--color-paper-dark)
```

**Danger Button:**
```
Background: var(--color-error)
Color: white
Same padding and radius
Hover: opacity 0.9
```

**Ghost Button (icon-only):**
```
Background: transparent
Color: var(--color-ink-light)
Padding: var(--space-2)
Border-radius: var(--radius-sm)
Hover: background var(--color-paper-darker), color var(--color-ink)
```

### WordCard (Popup)

```
Position: absolute (near clicked word) or fixed bottom sheet on mobile
Width: 320px (desktop) | 100% (mobile, bottom sheet)
Background: var(--color-paper-dark)
Border: 1px solid var(--color-paper-darker)
Border-radius: var(--radius-xl)
Box-shadow: var(--shadow-lg)
Padding: var(--space-6)
Max-height: 80vh, overflow-y: auto

Word (title): font-family var(--font-serif-alt), font-size var(--text-2xl), color var(--color-ink)
Phonetics: font-family var(--font-mono), font-size var(--text-sm), color var(--color-ink-light)
Part of speech: font-size var(--text-sm), color var(--color-accent), font-style italic
Definition: font-family var(--font-serif), font-size var(--text-base), line-height var(--leading-relaxed)
Example: same as definition, color var(--color-ink-light), left border 2px var(--color-accent-faint)
```

### FlashCard (Review)

```
Width: min(480px, 90vw)
Height: 280px
Background: var(--color-paper-dark)
Border-radius: var(--radius-xl)
Box-shadow: var(--shadow-lg)
Cursor: pointer
3D flip animation: transform-style: preserve-3d, transition: transform 400ms ease

Front: word in var(--font-serif), var(--text-2xl)
Back: definition layout same as WordCard
```

### Modal / Overlay

```
Overlay: position fixed, inset 0, background rgba(44, 36, 22, 0.5), backdrop-filter blur(2px)
Modal box: background var(--color-paper), border-radius var(--radius-xl), box-shadow var(--shadow-lg)
Width: min(480px, 90vw)
Padding: var(--space-8)
Animation: scale(0.96) → scale(1) + opacity 0 → 1, duration 200ms ease-out
```

### Tags / Chips

```
Font: var(--font-sans), var(--text-xs), var(--font-medium)
Padding: var(--space-1) var(--space-3)
Border-radius: var(--radius-full)
Background: var(--color-paper-darker)
Color: var(--color-ink-light)
Border: 1px solid var(--color-paper-darker)

Active/selected tag:
Background: var(--color-accent-faint)
Color: var(--color-accent-dark)
Border: 1px solid var(--color-accent)
```

### Toast Notifications

```
Position: fixed bottom-right (desktop) | bottom-center (mobile)
Background: var(--color-ink)
Color: var(--color-paper)
Font: var(--font-sans), var(--text-sm)
Padding: var(--space-3) var(--space-5)
Border-radius: var(--radius-lg)
Box-shadow: var(--shadow-lg)
Animation: slide up + fade in, auto-dismiss after 3s
```

### Article Text

```
Font-family: var(--font-serif)
Font-size: var(--article-font-size)  /* controlled by user setting */
Line-height: var(--article-line-height)
Color: var(--color-ink)
Max-width: var(--max-width-article)
Margin: 0 auto

Clickable word: cursor pointer, hover: background var(--color-accent-faint), border-radius 2px
Saved word: background var(--color-accent-faint), color var(--color-accent-dark), border-radius 2px
```

---

## Paper Texture

Apply a subtle paper texture to the main background:

```css
body {
  background-color: var(--color-paper);
  background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='400' height='400' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E");
}
```

---

## Animation Principles

- **Duration:** 150ms for micro-interactions, 200–300ms for modals, 400ms for card flips
- **Easing:** `ease-out` for entrances, `ease-in` for exits, `ease` for flips
- **No bouncy/spring animations** — everything is calm and deliberate
- **Hover transitions** always on `transition: all 150ms ease`
- **Never animate** layout properties (width, height) — only transform and opacity

---

## Icons

Use **Lucide React** icons (`lucide-react@0.383.0`). No other icon library.

Key icons used:
- `BookOpen` — articles
- `BookMarked` — vocabulary
- `RotateCcw` — review
- `Bookmark` — saves
- `Settings` — settings
- `Plus` — add
- `Trash2` — delete
- `Pencil` — edit
- `Check` — confirm / know it
- `X` — cancel / don't know
- `Upload` — import
- `Download` — export
- `ChevronRight` — navigate
- `Tag` — tags

Size: 16px default, 20px for nav icons, 24px for primary actions.

---

## Language System

### Active Language
Controls which content is shown. Stored in `localStorage` under key `polyglot_active_language`.
Default: `'en'`

The active language is any `code` value returned by `GET /api/languages`. It is **not** limited to `'en'` or `'es'` — any language activated in the DB is automatically supported.

```typescript
// lib/storage.ts
getActiveLang(): string          // reads localStorage, defaults to 'en'
setActiveLang(code: string): void

// lib/api.ts
fetchLanguages(): Promise<Language[]>
// Returns active languages: [{ code, name, native_name, is_active }, ...]
// Called once on app load; result stored in LanguageContext
```

### LanguageContext (`lib/context/LanguageContext.tsx`)
```typescript
interface LanguageContextValue {
  activeLang: string                   // current language code e.g. 'en'
  setActiveLang: (code: string) => void
  languages: Language[]                // active languages from API
}
// Provided at root layout level
// All data-fetching hooks read activeLang and re-fetch when it changes
// NavBar reads languages[] to render switcher pills dynamically
```

### LanguageSwitcher Component (`components/LanguageSwitcher.tsx`)
```tsx
// Renders inside NavBar — no hardcoded language list
// Maps each language in languages[] to a pill button
// Label: language.native_name (e.g. "English", "Español", "Français")
// On click: setActiveLang(language.code)
// Adding a new language to DB → appears automatically on next app load
// Zero frontend code changes needed when new languages are activated
```

### UI Language
In v1 the interface is **English only**. No i18n translation system needed.
(中文 / Español / other UI labels are v2 scope — do not implement.)
