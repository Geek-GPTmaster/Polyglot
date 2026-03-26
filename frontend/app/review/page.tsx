"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, CheckCircle2, XCircle, RotateCcw, BookOpen } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";
import { fetchReviewDue, submitReviewResult } from "@/lib/api";
import Button from "@/components/Button";
import type { ReviewCard } from "@/lib/types";

// ---------------------------------------------------------------------------
// FlashCard
// ---------------------------------------------------------------------------

function FlashCard({
  card,
  onResult,
}: {
  card: ReviewCard;
  onResult: (known: boolean) => void;
}) {
  const [flipped, setFlipped] = useState(false);

  // Reset flip when card changes
  useEffect(() => { setFlipped(false); }, [card.id]);

  return (
    <div style={{ width: "100%", maxWidth: "560px", margin: "0 auto" }}>
      {/* Card face */}
      <div
        className="card"
        style={{
          padding:       "var(--space-10) var(--space-8)",
          textAlign:     "center",
          minHeight:     "280px",
          display:       "flex",
          flexDirection: "column",
          justifyContent: "center",
          gap:           "var(--space-4)",
          position:      "relative",
          animation:     "fadeIn 200ms ease-out",
        }}
      >
        {/* Word (always visible) */}
        <h2
          style={{
            fontFamily: "var(--font-serif-alt)",
            fontSize:   "clamp(2rem, 6vw, 3rem)",
            fontWeight: "var(--font-semibold)",
            color:      "var(--color-ink)",
            margin:     0,
            lineHeight: 1.1,
          }}
        >
          {card.word}
        </h2>

        {card.phonetics && (
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontSize:   "var(--text-sm)",
              color:      "var(--color-ink-light)",
            }}
          >
            {card.phonetics}
          </span>
        )}

        {/* Back content (revealed on flip) */}
        {flipped ? (
          <div style={{ animation: "fadeIn 180ms ease-out" }}>
            {card.part_of_speech && (
              <span
                style={{
                  fontFamily: "var(--font-sans)",
                  fontSize:   "var(--text-sm)",
                  color:      "var(--color-accent)",
                  fontStyle:  "italic",
                  display:    "block",
                  marginBottom: "var(--space-2)",
                }}
              >
                {card.part_of_speech}
              </span>
            )}

            {card.definition ? (
              <p
                style={{
                  fontFamily:  "var(--font-serif)",
                  fontSize:    "var(--text-base)",
                  color:       "var(--color-ink)",
                  lineHeight:  "var(--leading-relaxed)",
                  margin:      "0 0 var(--space-3)",
                }}
              >
                {card.definition}
              </p>
            ) : (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)", margin: 0 }}>
                No definition available.
              </p>
            )}

            {card.example && (
              <p
                style={{
                  fontFamily:  "var(--font-serif)",
                  fontSize:    "var(--text-sm)",
                  color:       "var(--color-ink-light)",
                  fontStyle:   "italic",
                  lineHeight:  "var(--leading-relaxed)",
                  margin:      "0 auto",
                  maxWidth:    "420px",
                  paddingLeft: "var(--space-4)",
                  borderLeft:  "2px solid var(--color-accent-faint)",
                  textAlign:   "left",
                }}
              >
                {card.example}
              </p>
            )}
          </div>
        ) : (
          <p
            style={{
              fontFamily: "var(--font-sans)",
              fontSize:   "var(--text-xs)",
              color:      "var(--color-ink-faint)",
              margin:     0,
              letterSpacing: "0.04em",
              textTransform: "uppercase",
            }}
          >
            Click to reveal
          </p>
        )}
      </div>

      {/* Action buttons */}
      <div style={{ marginTop: "var(--space-6)", display: "flex", gap: "var(--space-3)" }}>
        {!flipped ? (
          <Button
            variant="secondary"
            onClick={() => setFlipped(true)}
            style={{ flex: 1, justifyContent: "center" }}
          >
            Reveal Definition
          </Button>
        ) : (
          <>
            <button
              onClick={() => onResult(false)}
              style={{
                flex:          1,
                display:       "flex",
                alignItems:    "center",
                justifyContent: "center",
                gap:           "var(--space-2)",
                padding:       "var(--space-3) var(--space-4)",
                background:    "var(--color-error)",
                border:        "none",
                borderRadius:  "var(--radius-lg)",
                color:         "#fff",
                fontFamily:    "var(--font-sans)",
                fontSize:      "var(--text-sm)",
                fontWeight:    "var(--font-medium)",
                cursor:        "pointer",
                transition:    "opacity 150ms ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <XCircle size={16} /> Don&apos;t know
            </button>
            <button
              onClick={() => onResult(true)}
              style={{
                flex:          1,
                display:       "flex",
                alignItems:    "center",
                justifyContent: "center",
                gap:           "var(--space-2)",
                padding:       "var(--space-3) var(--space-4)",
                background:    "var(--color-accent)",
                border:        "none",
                borderRadius:  "var(--radius-lg)",
                color:         "#fff",
                fontFamily:    "var(--font-sans)",
                fontSize:      "var(--text-sm)",
                fontWeight:    "var(--font-medium)",
                cursor:        "pointer",
                transition:    "opacity 150ms ease",
              }}
              onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.opacity = "0.85"; }}
              onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.opacity = "1"; }}
            >
              <CheckCircle2 size={16} /> Know it
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Summary screen
// ---------------------------------------------------------------------------

function ReviewSummary({
  total,
  known,
  onRestart,
}: {
  total: number;
  known: number;
  onRestart: () => void;
}) {
  const pct = total > 0 ? Math.round((known / total) * 100) : 0;

  return (
    <div style={{ textAlign: "center", maxWidth: "480px", margin: "0 auto", animation: "fadeIn 250ms ease-out" }}>
      <div style={{ fontSize: "3.5rem", marginBottom: "var(--space-4)" }}>
        {pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📖"}
      </div>
      <h2
        style={{
          fontFamily: "var(--font-serif)",
          fontSize:   "var(--text-2xl)",
          fontWeight: "var(--font-semibold)",
          color:      "var(--color-ink)",
          margin:     "0 0 var(--space-2)",
        }}
      >
        Session complete!
      </h2>
      <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-base)", color: "var(--color-ink-light)", margin: "0 0 var(--space-8)" }}>
        You knew <strong style={{ color: "var(--color-ink)" }}>{known}</strong> out of{" "}
        <strong style={{ color: "var(--color-ink)" }}>{total}</strong> words ({pct}%).
      </p>

      {/* Score bar */}
      <div
        style={{
          background:   "var(--color-paper-darker)",
          borderRadius: "var(--radius-full)",
          height:       "8px",
          marginBottom: "var(--space-8)",
          overflow:     "hidden",
        }}
      >
        <div
          style={{
            height:       "100%",
            width:        `${pct}%`,
            background:   pct >= 80 ? "var(--color-accent)" : pct >= 50 ? "#f59e0b" : "var(--color-error)",
            borderRadius: "var(--radius-full)",
            transition:   "width 600ms ease-out",
          }}
        />
      </div>

      <div style={{ display: "flex", gap: "var(--space-3)", justifyContent: "center" }}>
        <Button variant="secondary" onClick={onRestart}>
          <RotateCcw size={14} /> Review Again
        </Button>
        <Link href="/vocabulary">
          <Button variant="ghost">
            <BookOpen size={14} /> Vocabulary
          </Button>
        </Link>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Review page
// ---------------------------------------------------------------------------

type SessionState = "loading" | "empty" | "session" | "summary";

export default function ReviewPage() {
  const { activeLang } = useLanguage();

  const [sessionState, setSessionState] = useState<SessionState>("loading");
  const [cards, setCards]               = useState<ReviewCard[]>([]);
  const [index, setIndex]               = useState(0);
  const [known, setKnown]               = useState(0);
  const [total, setTotal]               = useState(0);
  const [submitting, setSubmitting]     = useState(false);
  const [dailyLimit, setDailyLimit]     = useState(20);

  const loadSession = useCallback(async () => {
    setSessionState("loading");
    setIndex(0);
    setKnown(0);
    try {
      const data = await fetchReviewDue(activeLang);
      setDailyLimit(data.daily_limit);
      if (data.cards.length === 0) {
        setSessionState("empty");
      } else {
        setCards(data.cards);
        setTotal(data.cards.length);
        setSessionState("session");
      }
    } catch {
      setSessionState("empty");
    }
  }, [activeLang]);

  useEffect(() => { loadSession(); }, [loadSession]);

  const handleResult = useCallback(async (isKnown: boolean) => {
    if (submitting || sessionState !== "session") return;
    const card = cards[index];
    setSubmitting(true);
    try {
      await submitReviewResult(card.id, isKnown ? "known" : "unknown");
    } catch {
      // fire-and-forget; proceed regardless
    } finally {
      setSubmitting(false);
    }

    if (isKnown) setKnown((n) => n + 1);

    const next = index + 1;
    if (next >= cards.length) {
      setSessionState("summary");
    } else {
      setIndex(next);
    }
  }, [submitting, sessionState, cards, index]);

  // ── Render ──────────────────────────────────────────────────

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <Link
          href="/"
          style={{
            display:        "inline-flex",
            alignItems:     "center",
            gap:            "var(--space-1)",
            fontFamily:     "var(--font-sans)",
            fontSize:       "var(--text-sm)",
            color:          "var(--color-ink-light)",
            textDecoration: "none",
            marginBottom:   "var(--space-4)",
          }}
        >
          <ArrowLeft size={14} /> Home
        </Link>

        <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", flexWrap: "wrap", gap: "var(--space-2)" }}>
          <h1
            style={{
              fontFamily: "var(--font-serif)",
              fontSize:   "var(--text-2xl)",
              fontWeight: "var(--font-semibold)",
              color:      "var(--color-ink)",
              margin:     0,
            }}
          >
            Review
          </h1>
          {sessionState === "session" && (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)" }}>
              {index + 1} / {total}
            </span>
          )}
        </div>
      </div>

      {/* Progress bar */}
      {sessionState === "session" && (
        <div
          style={{
            background:   "var(--color-paper-darker)",
            borderRadius: "var(--radius-full)",
            height:       "4px",
            marginBottom: "var(--space-8)",
            overflow:     "hidden",
          }}
        >
          <div
            style={{
              height:       "100%",
              width:        `${((index) / total) * 100}%`,
              background:   "var(--color-accent)",
              borderRadius: "var(--radius-full)",
              transition:   "width 200ms ease-out",
            }}
          />
        </div>
      )}

      {/* States */}
      {sessionState === "loading" && (
        <div style={{ textAlign: "center", padding: "var(--space-20)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)" }}>
          Loading cards…
        </div>
      )}

      {sessionState === "empty" && (
        <div style={{ textAlign: "center", padding: "var(--space-16) 0", animation: "fadeIn 250ms ease-out" }}>
          <p style={{ fontSize: "2.5rem", marginBottom: "var(--space-4)" }}>✓</p>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize:   "var(--text-xl)",
              fontWeight: "var(--font-semibold)",
              color:      "var(--color-ink)",
              margin:     "0 0 var(--space-2)",
            }}
          >
            All caught up!
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", margin: "0 0 var(--space-6)" }}>
            No cards due right now. Your daily limit is {dailyLimit} words.
          </p>
          <Link href="/vocabulary">
            <Button variant="secondary">
              <BookOpen size={14} /> Go to Vocabulary
            </Button>
          </Link>
        </div>
      )}

      {sessionState === "session" && cards[index] && (
        <FlashCard
          card={cards[index]}
          onResult={handleResult}
        />
      )}

      {sessionState === "summary" && (
        <ReviewSummary
          total={total}
          known={known}
          onRestart={loadSession}
        />
      )}
    </div>
  );
}
