"use client";

import { useEffect, useRef, useState } from "react";
import { X, BookMarked, Check, Volume2 } from "lucide-react";
import Button from "./Button";
import { fetchDefinition, createVocabularyEntry } from "@/lib/api";
import { useToast } from "./Toast";
import type { WordDefinition } from "@/lib/types";

interface WordCardProps {
  word: string;
  language: string;
  /** Viewport position where card should appear */
  position: { x: number; y: number };
  /** Set of already-saved lowercase words */
  savedWords: Set<string>;
  onSaved: (word: string) => void;
  onClose: () => void;
  sourceArticleId?: number;
}

const CARD_W = 320;

function cardStyle(pos: { x: number; y: number }): React.CSSProperties {
  if (typeof window === "undefined") return { position: "fixed", left: pos.x, top: pos.y };

  const isMobile = window.innerWidth < 768;
  if (isMobile) {
    return {
      position:     "fixed",
      bottom:       0,
      left:         0,
      right:        0,
      width:        "100%",
      borderRadius: "var(--radius-xl) var(--radius-xl) 0 0",
      maxHeight:    "80vh",
    };
  }

  let x = pos.x + 14;
  let y = pos.y + 14;
  if (x + CARD_W > window.innerWidth - 16)  x = pos.x - CARD_W - 14;
  if (y + 340    > window.innerHeight - 16) y = Math.max(16, window.innerHeight - 356);

  return {
    position: "fixed",
    left:     Math.max(16, x),
    top:      Math.max(16, y),
    width:    `${CARD_W}px`,
  };
}

export default function WordCard({
  word,
  language,
  position,
  savedWords,
  onSaved,
  onClose,
  sourceArticleId,
}: WordCardProps) {
  const { toast } = useToast();
  const [definition, setDefinition] = useState<WordDefinition | null>(null);
  const [loading, setLoading]       = useState(true);
  const [saving, setSaving]         = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const normalized = word.toLowerCase().replace(/[^a-z0-9]/g, "");
  const isSaved    = savedWords.has(normalized);

  // Fetch definition
  useEffect(() => {
    setLoading(true);
    setDefinition(null);
    fetchDefinition(word, language)
      .then(setDefinition)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [word, language]);

  // Close on Escape or click outside
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    const onClickOutside = (e: MouseEvent) => {
      if (cardRef.current && !cardRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("mousedown", onClickOutside);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("mousedown", onClickOutside);
    };
  }, [onClose]);

  async function handleSave() {
    setSaving(true);
    try {
      await createVocabularyEntry({
        word: normalized,
        language_code: language,
        source_article_id: sourceArticleId,
      });
      onSaved(normalized);
      toast(`"${normalized}" saved to vocabulary.`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("409") || msg.toLowerCase().includes("already")) {
        toast(`"${normalized}" is already in vocabulary.`, "info");
        onSaved(normalized);
      } else {
        toast("Failed to save word.", "error");
      }
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      ref={cardRef}
      style={{
        ...cardStyle(position),
        background:   "var(--color-paper-dark)",
        border:       "1px solid var(--color-paper-darker)",
        borderRadius: "var(--radius-xl)",
        boxShadow:    "var(--shadow-lg)",
        padding:      "var(--space-6)",
        overflowY:    "auto",
        zIndex:       150,
        animation:    "scaleIn 150ms ease-out",
      }}
    >
      {/* Header */}
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: "var(--space-4)" }}>
        <div>
          <h3
            style={{
              fontFamily: "var(--font-serif-alt)",
              fontSize:   "var(--text-2xl)",
              fontWeight: "var(--font-semibold)",
              color:      "var(--color-ink)",
              margin:     0,
              lineHeight: 1.1,
            }}
          >
            {word}
          </h3>
          {definition?.phonetics && (
            <span
              style={{
                fontFamily: "var(--font-mono)",
                fontSize:   "var(--text-sm)",
                color:      "var(--color-ink-light)",
                display:    "block",
                marginTop:  "var(--space-1)",
              }}
            >
              {definition.phonetics}
            </span>
          )}
        </div>
        <button onClick={onClose} className="btn-ghost" aria-label="Close">
          <X size={16} />
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)", padding: "var(--space-4) 0" }}>
          Looking up…
        </div>
      )}

      {/* Not found */}
      {!loading && !definition && (
        <div style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)", padding: "var(--space-2) 0" }}>
          No definition found.
        </div>
      )}

      {/* Definition */}
      {!loading && definition && (
        <>
          {definition.part_of_speech && (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-accent)", fontStyle: "italic", display: "block", marginBottom: "var(--space-2)" }}>
              {definition.part_of_speech}
            </span>
          )}

          {definition.definition && (
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-base)", color: "var(--color-ink)", lineHeight: "var(--leading-relaxed)", margin: "0 0 var(--space-3)" }}>
              {definition.definition}
            </p>
          )}

          {definition.example && (
            <p
              style={{
                fontFamily:  "var(--font-serif)",
                fontSize:    "var(--text-base)",
                color:       "var(--color-ink-light)",
                fontStyle:   "italic",
                lineHeight:  "var(--leading-relaxed)",
                margin:      "0 0 var(--space-3)",
                paddingLeft: "var(--space-4)",
                borderLeft:  "2px solid var(--color-accent-faint)",
              }}
            >
              {definition.example}
            </p>
          )}

          {definition.synonyms.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-1)", marginBottom: "var(--space-4)" }}>
              {definition.synonyms.slice(0, 6).map((s) => (
                <span key={s} style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", background: "var(--color-paper-darker)", borderRadius: "var(--radius-full)", padding: "2px 8px", color: "var(--color-ink-light)" }}>
                  {s}
                </span>
              ))}
            </div>
          )}
        </>
      )}

      {/* Save button */}
      <Button
        variant={isSaved ? "secondary" : "primary"}
        size="sm"
        disabled={isSaved}
        loading={saving}
        onClick={handleSave}
        style={{ width: "100%" }}
      >
        {isSaved ? <Check size={14} /> : <BookMarked size={14} />}
        {isSaved ? "Saved ✓" : "Save to Vocabulary"}
      </Button>
    </div>
  );
}
