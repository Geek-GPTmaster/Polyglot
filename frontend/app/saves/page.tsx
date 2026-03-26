"use client";

import { useCallback, useEffect, useState } from "react";
import { Trash2, Quote, MessageSquare, ExternalLink } from "lucide-react";
import Link from "next/link";
import { fetchSaves, deleteSave } from "@/lib/api";
import { useToast } from "@/components/Toast";
import type { Save } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

// ---------------------------------------------------------------------------
// SaveCard
// ---------------------------------------------------------------------------

function SaveCard({
  save,
  onDelete,
}: {
  save: Save;
  onDelete: (id: number) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div
      className="card"
      style={{
        padding:    "var(--space-5) var(--space-6)",
        display:    "flex",
        flexDirection: "column",
        gap:        "var(--space-3)",
        animation:  "fadeIn 200ms ease-out",
      }}
    >
      {/* Header row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: "var(--space-3)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
          <span
            style={{
              display:      "inline-flex",
              alignItems:   "center",
              gap:          "var(--space-1)",
              fontFamily:   "var(--font-sans)",
              fontSize:     "var(--text-xs)",
              fontWeight:   "var(--font-medium)",
              color:        save.type === "quote" ? "var(--color-accent)" : "var(--color-ink-light)",
              background:   save.type === "quote" ? "var(--color-accent-faint)" : "var(--color-paper-darker)",
              borderRadius: "var(--radius-full)",
              padding:      "2px 8px",
              textTransform: "capitalize",
            }}
          >
            {save.type === "quote" ? <Quote size={11} /> : <MessageSquare size={11} />}
            {save.type}
          </span>
          <Link
            href={`/articles/${save.article_id}`}
            style={{
              fontFamily:     "var(--font-sans)",
              fontSize:       "var(--text-xs)",
              color:          "var(--color-ink-light)",
              textDecoration: "none",
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "var(--space-1)",
            }}
          >
            {save.article_title} <ExternalLink size={11} />
          </Link>
        </div>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-faint)", flexShrink: 0 }}>
          {formatDate(save.created_at)}
        </span>
      </div>

      {/* Saved text */}
      <blockquote
        style={{
          margin:      0,
          paddingLeft: "var(--space-4)",
          borderLeft:  "3px solid var(--color-accent-faint)",
          fontFamily:  "var(--font-serif)",
          fontSize:    "var(--text-base)",
          color:       "var(--color-ink)",
          lineHeight:  "var(--leading-relaxed)",
          fontStyle:   "italic",
        }}
      >
        {save.saved_text}
      </blockquote>

      {/* Note (annotation only) */}
      {save.note && (
        <p
          style={{
            margin:     0,
            fontFamily: "var(--font-sans)",
            fontSize:   "var(--text-sm)",
            color:      "var(--color-ink-light)",
            lineHeight: "var(--leading-relaxed)",
          }}
        >
          {save.note}
        </p>
      )}

      {/* Delete */}
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        {confirmDelete ? (
          <div style={{ display: "flex", alignItems: "center", gap: "var(--space-2)" }}>
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)" }}>
              Delete this save?
            </span>
            <button
              onClick={() => onDelete(save.id)}
              style={{
                fontFamily:   "var(--font-sans)",
                fontSize:     "var(--text-xs)",
                fontWeight:   "var(--font-medium)",
                color:        "#fff",
                background:   "var(--color-error)",
                border:       "none",
                borderRadius: "var(--radius-sm)",
                padding:      "2px 10px",
                cursor:       "pointer",
              }}
            >
              Yes
            </button>
            <button
              onClick={() => setConfirmDelete(false)}
              style={{
                fontFamily:   "var(--font-sans)",
                fontSize:     "var(--text-xs)",
                color:        "var(--color-ink-light)",
                background:   "transparent",
                border:       "none",
                cursor:       "pointer",
                padding:      "2px 6px",
              }}
            >
              Cancel
            </button>
          </div>
        ) : (
          <button
            onClick={() => setConfirmDelete(true)}
            className="btn-ghost"
            style={{ padding: "4px", color: "var(--color-ink-faint)" }}
            aria-label="Delete save"
          >
            <Trash2 size={14} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Saves page
// ---------------------------------------------------------------------------

type Filter = "all" | "quote" | "annotation";

export default function SavesPage() {
  const { toast } = useToast();
  const [saves, setSaves]     = useState<Save[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter]   = useState<Filter>("all");

  const loadSaves = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchSaves(filter === "all" ? undefined : filter);
      setSaves(data);
    } catch {
      toast("Failed to load saves.", "error");
    } finally {
      setLoading(false);
    }
  }, [filter, toast]);

  useEffect(() => { loadSaves(); }, [loadSaves]);

  const handleDelete = useCallback(async (id: number) => {
    try {
      await deleteSave(id);
      setSaves((prev) => prev.filter((s) => s.id !== id));
      toast("Save deleted.");
    } catch {
      toast("Failed to delete.", "error");
    }
  }, [toast]);

  // ── Render ────────────────────────────────────────────────

  const filterBtnStyle = (active: boolean): React.CSSProperties => ({
    fontFamily:   "var(--font-sans)",
    fontSize:     "var(--text-sm)",
    fontWeight:   active ? "var(--font-medium)" : "400",
    color:        active ? "var(--color-ink)" : "var(--color-ink-light)",
    background:   active ? "var(--color-paper-dark)" : "transparent",
    border:       "1px solid",
    borderColor:  active ? "var(--color-paper-darker)" : "transparent",
    borderRadius: "var(--radius-full)",
    padding:      "var(--space-1) var(--space-4)",
    cursor:       "pointer",
    transition:   "all 150ms ease",
  });

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ marginBottom: "var(--space-6)" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize:   "var(--text-2xl)",
            fontWeight: "var(--font-semibold)",
            color:      "var(--color-ink)",
            margin:     "0 0 var(--space-1)",
          }}
        >
          Saves
        </h1>
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", margin: 0 }}>
          Quotes and annotations from your reading.
        </p>
      </div>

      {/* Filter tabs */}
      <div style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-6)" }}>
        {(["all", "quote", "annotation"] as Filter[]).map((f) => (
          <button key={f} style={filterBtnStyle(filter === f)} onClick={() => setFilter(f)}>
            {f === "all" ? "All" : f === "quote" ? "Quotes" : "Annotations"}
          </button>
        ))}
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-20)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)" }}>
          Loading…
        </div>
      ) : saves.length === 0 ? (
        <div
          style={{
            textAlign:  "center",
            padding:    "var(--space-16) 0",
            animation:  "fadeIn 250ms ease-out",
          }}
        >
          <p style={{ fontSize: "2rem", marginBottom: "var(--space-4)" }}>
            {filter === "quote" ? "❝" : filter === "annotation" ? "📝" : "🔖"}
          </p>
          <h2
            style={{
              fontFamily: "var(--font-serif)",
              fontSize:   "var(--text-lg)",
              fontWeight: "var(--font-semibold)",
              color:      "var(--color-ink)",
              margin:     "0 0 var(--space-2)",
            }}
          >
            No {filter === "all" ? "saves" : filter + "s"} yet
          </h2>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", margin: "0 0 var(--space-6)" }}>
            Select text while reading an article to save quotes and annotations.
          </p>
          <Link
            href="/articles"
            style={{
              fontFamily:     "var(--font-sans)",
              fontSize:       "var(--text-sm)",
              color:          "var(--color-accent)",
              textDecoration: "none",
              fontWeight:     "var(--font-medium)",
            }}
          >
            Browse articles →
          </Link>
        </div>
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-3)" }}>
          {saves.map((save) => (
            <SaveCard key={save.id} save={save} onDelete={handleDelete} />
          ))}
        </div>
      )}
    </div>
  );
}
