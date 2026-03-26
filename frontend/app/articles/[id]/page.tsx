"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ArrowLeft, FileText } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";
import { fetchArticle, fetchVocabulary, patchScrollPosition } from "@/lib/api";
import WordCard from "@/components/WordCard";
import SaveContextMenu from "@/components/SaveContextMenu";
import type { Article } from "@/lib/types";

// ---------------------------------------------------------------------------
// Text tokeniser
// ---------------------------------------------------------------------------

interface Token { isWord: boolean; text: string }

function tokenize(text: string): Token[] {
  const tokens: Token[] = [];
  const re = /(\w+)/g;
  let last = 0, m: RegExpExecArray | null;
  while ((m = re.exec(text)) !== null) {
    if (m.index > last) tokens.push({ isWord: false, text: text.slice(last, m.index) });
    tokens.push({ isWord: true, text: m[0] });
    last = re.lastIndex;
  }
  if (last < text.length) tokens.push({ isWord: false, text: text.slice(last) });
  return tokens;
}

// ---------------------------------------------------------------------------
// Rendered paragraph
// ---------------------------------------------------------------------------

function ArticleParagraph({
  text,
  savedWords,
  onWordClick,
}: {
  text: string;
  savedWords: Set<string>;
  onWordClick: (word: string, e: React.MouseEvent<HTMLSpanElement>) => void;
}) {
  const tokens = useMemo(() => tokenize(text), [text]);

  return (
    <p style={{ margin: "0 0 1.4em" }}>
      {tokens.map((tok, i) => {
        if (!tok.isWord) {
          // preserve newlines within a paragraph as <br>
          if (tok.text.includes("\n")) {
            return tok.text.split("\n").map((part, j) => (
              <span key={`${i}-${j}`}>{j > 0 && <br />}{part}</span>
            ));
          }
          return <span key={i}>{tok.text}</span>;
        }
        const lower   = tok.text.toLowerCase();
        const isSaved = savedWords.has(lower);
        return (
          <span
            key={i}
            className={`article-word${isSaved ? " saved" : ""}`}
            onMouseUp={(e) => e.stopPropagation()}   // prevent article mouseup from firing
            onClick={(e) => { e.stopPropagation(); onWordClick(tok.text, e); }}
          >
            {tok.text}
          </span>
        );
      })}
    </p>
  );
}

// ---------------------------------------------------------------------------
// Text-selection detector hook
// ---------------------------------------------------------------------------

interface TextSelection {
  text: string;
  charStart: number;
  charEnd: number;
  x: number;
  y: number;
}

// ---------------------------------------------------------------------------
// Article reader page
// ---------------------------------------------------------------------------

export default function ArticleReaderPage({
  params,
}: {
  params: { id: string };
}) {
  const articleId        = parseInt(params.id, 10);
  const { activeLang }   = useLanguage();

  const [article, setArticle]     = useState<Article | null>(null);
  const [loading, setLoading]     = useState(true);
  const [savedWords, setSavedWords] = useState<Set<string>>(new Set());

  // WordCard state
  const [activeWord, setActiveWord]     = useState<string | null>(null);
  const [wordCardPos, setWordCardPos]   = useState<{ x: number; y: number } | null>(null);

  // SaveContextMenu state
  const [selection, setSelection] = useState<TextSelection | null>(null);

  const articleRef     = useRef<HTMLDivElement>(null);
  const scrollTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrolledRef    = useRef(false);

  // ── Load article + vocab ──────────────────────────────────
  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetchArticle(articleId),
      fetchVocabulary(activeLang),
    ])
      .then(([art, vocab]) => {
        setArticle(art);
        setSavedWords(new Set(vocab.map((v) => v.word.toLowerCase())));
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [articleId, activeLang]);

  // ── Restore scroll position ───────────────────────────────
  useEffect(() => {
    if (!article || scrolledRef.current) return;
    if (article.scroll_position > 0) {
      window.scrollTo({ top: article.scroll_position, behavior: "instant" });
    }
    scrolledRef.current = true;
  }, [article]);

  // ── Auto-save scroll position (throttled 5s) ─────────────
  useEffect(() => {
    if (!article) return;
    const handleScroll = () => {
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
      scrollTimerRef.current = setTimeout(() => {
        patchScrollPosition(article.id, Math.round(window.scrollY)).catch(() => {});
      }, 5000);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", handleScroll);
      if (scrollTimerRef.current) clearTimeout(scrollTimerRef.current);
    };
  }, [article]);

  // ── Word click → WordCard ─────────────────────────────────
  const handleWordClick = useCallback(
    (word: string, e: React.MouseEvent<HTMLSpanElement>) => {
      // Don't open WordCard if there's an active text selection
      const sel = window.getSelection();
      if (sel && sel.toString().trim().length > 2) return;

      setSelection(null);   // close any open context menu
      setActiveWord(word);
      setWordCardPos({ x: e.clientX, y: e.clientY });
    },
    []
  );

  // ── Text selection → SaveContextMenu ─────────────────────
  const handleArticleMouseUp = useCallback((e: React.MouseEvent<HTMLDivElement>) => {
    const sel = window.getSelection();
    if (!sel || sel.rangeCount === 0) return;

    const text = sel.toString().trim();
    if (text.length < 3) return;      // ignore tiny accidental selections

    const container = articleRef.current;
    if (!container) return;

    // Make sure the selection is inside our article
    if (!container.contains(sel.anchorNode) || !container.contains(sel.focusNode)) return;

    // Get range bounding rect for positioning
    const range = sel.getRangeAt(0);
    const rect  = range.getBoundingClientRect();

    // Compute char offsets relative to article text
    const preRange = document.createRange();
    preRange.setStart(container, 0);
    preRange.setEnd(range.startContainer, range.startOffset);
    const charStart = preRange.toString().length;
    const charEnd   = charStart + text.length;

    setActiveWord(null);    // close any open WordCard
    setSelection({
      text,
      charStart,
      charEnd,
      x: rect.left,
      y: rect.top,
    });
  }, []);

  // ── Close menus on outside click ──────────────────────────
  useEffect(() => {
    const handler = () => {
      if (!window.getSelection()?.toString().trim()) {
        setSelection(null);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // ── Paragraphs ────────────────────────────────────────────
  const paragraphs = useMemo(
    () => (article?.content ?? "").split(/\n{2,}/),
    [article?.content]
  );

  // ── Render ────────────────────────────────────────────────
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "var(--space-20)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)" }}>
        Loading article…
      </div>
    );
  }

  if (!article) {
    return (
      <div className="page-container">
        <p style={{ fontFamily: "var(--font-sans)", color: "var(--color-error)" }}>Article not found.</p>
        <Link href="/articles" className="btn-secondary" style={{ marginTop: "var(--space-4)", display: "inline-flex" }}>
          <ArrowLeft size={15} /> Back to Articles
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      {/* Back link + meta */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <Link
          href="/articles"
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            "var(--space-1)",
            fontFamily:     "var(--font-sans)",
            fontSize:       "var(--text-sm)",
            color:          "var(--color-ink-light)",
            textDecoration: "none",
            marginBottom:   "var(--space-4)",
            transition:     "color 150ms ease",
          }}
        >
          <ArrowLeft size={14} /> Articles
        </Link>

        <h1
          style={{
            fontFamily:  "var(--font-serif)",
            fontSize:    "var(--text-xl)",
            fontWeight:  "var(--font-semibold)",
            color:       "var(--color-ink)",
            margin:      "0 0 var(--space-2)",
            lineHeight:  "var(--leading-tight)",
          }}
        >
          {article.title}
        </h1>
        <span
          style={{
            fontFamily:  "var(--font-sans)",
            fontSize:    "var(--text-xs)",
            color:       "var(--color-ink-light)",
            display:     "flex",
            alignItems:  "center",
            gap:         "var(--space-2)",
          }}
        >
          <FileText size={12} />
          {article.word_count.toLocaleString()} words · {article.language_code.toUpperCase()}
        </span>
      </div>

      {/* Article body */}
      <div
        ref={articleRef}
        className="article-text"
        style={{ maxWidth: "var(--max-width-article)", margin: "0 auto" }}
        onMouseUp={handleArticleMouseUp}
      >
        {paragraphs.map((para, i) => (
          <ArticleParagraph
            key={i}
            text={para}
            savedWords={savedWords}
            onWordClick={handleWordClick}
          />
        ))}
      </div>

      {/* WordCard popup */}
      {activeWord && wordCardPos && (
        <WordCard
          word={activeWord}
          language={activeLang}
          position={wordCardPos}
          savedWords={savedWords}
          onSaved={(w) => setSavedWords((prev) => { const s = new Set(prev); s.add(w); return s; })}
          onClose={() => { setActiveWord(null); setWordCardPos(null); }}
          sourceArticleId={article.id}
        />
      )}

      {/* Save context menu */}
      {selection && (
        <SaveContextMenu
          articleId={article.id}
          selection={selection}
          onSaved={() => {}}
          onClose={() => { setSelection(null); window.getSelection()?.removeAllRanges(); }}
        />
      )}
    </div>
  );
}
