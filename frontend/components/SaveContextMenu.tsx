"use client";

import { useRef, useState } from "react";
import { MessageSquare, Quote } from "lucide-react";
import Button from "./Button";
import { createSave } from "@/lib/api";
import { useToast } from "./Toast";

interface Selection {
  text: string;
  charStart: number;
  charEnd: number;
  x: number;
  y: number;
}

interface SaveContextMenuProps {
  articleId: number;
  selection: Selection;
  onSaved: () => void;
  onClose: () => void;
}

export default function SaveContextMenu({
  articleId,
  selection,
  onSaved,
  onClose,
}: SaveContextMenuProps) {
  const { toast }         = useToast();
  const [mode, setMode]   = useState<"menu" | "annotate">("menu");
  const [note, setNote]   = useState("");
  const [loading, setLoading] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Position: above the selection end point
  const style: React.CSSProperties = {
    position:     "fixed",
    left:         Math.min(selection.x, window.innerWidth - 220),
    top:          Math.max(8, selection.y - (mode === "annotate" ? 140 : 52)),
    zIndex:       160,
    background:   "var(--color-ink)",
    borderRadius: "var(--radius-lg)",
    boxShadow:    "var(--shadow-lg)",
    overflow:     "hidden",
    animation:    "scaleIn 120ms ease-out",
    minWidth:     "200px",
  };

  async function saveQuote() {
    setLoading(true);
    try {
      await createSave({
        article_id: articleId,
        type: "quote",
        saved_text: selection.text,
        char_start: selection.charStart,
        char_end: selection.charEnd,
      });
      toast("Quote saved.");
      onSaved();
      onClose();
    } catch {
      toast("Failed to save quote.", "error");
    } finally {
      setLoading(false);
    }
  }

  async function saveAnnotation() {
    setLoading(true);
    try {
      await createSave({
        article_id: articleId,
        type: "annotation",
        saved_text: selection.text,
        note: note.trim() || undefined,
        char_start: selection.charStart,
        char_end: selection.charEnd,
      });
      toast("Annotation saved.");
      onSaved();
      onClose();
    } catch {
      toast("Failed to save annotation.", "error");
    } finally {
      setLoading(false);
    }
  }

  const btnBase: React.CSSProperties = {
    display:    "flex",
    alignItems: "center",
    gap:        "var(--space-2)",
    width:      "100%",
    background: "transparent",
    border:     "none",
    color:      "var(--color-paper)",
    fontFamily: "var(--font-sans)",
    fontSize:   "var(--text-sm)",
    fontWeight: "var(--font-medium)",
    padding:    "var(--space-2) var(--space-4)",
    cursor:     "pointer",
    textAlign:  "left",
    transition: "background 100ms ease",
    whiteSpace: "nowrap",
  };

  return (
    <div ref={menuRef} style={style} onMouseDown={(e) => e.preventDefault()}>
      {mode === "menu" ? (
        <>
          <button style={btnBase} onClick={() => setMode("annotate")}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <MessageSquare size={14} /> Annotate
          </button>
          <button style={btnBase} onClick={saveQuote} disabled={loading}
            onMouseEnter={(e) => { (e.currentTarget as HTMLElement).style.background = "rgba(255,255,255,0.1)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLElement).style.background = "transparent"; }}
          >
            <Quote size={14} /> Quote
          </button>
        </>
      ) : (
        <div style={{ padding: "var(--space-3)" }}>
          <textarea
            autoFocus
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Add a note… (optional)"
            rows={3}
            style={{
              width:        "100%",
              background:   "rgba(255,255,255,0.12)",
              border:       "1px solid rgba(255,255,255,0.2)",
              borderRadius: "var(--radius-sm)",
              color:        "var(--color-paper)",
              fontFamily:   "var(--font-sans)",
              fontSize:     "var(--text-sm)",
              padding:      "var(--space-2)",
              resize:       "none",
              outline:      "none",
              marginBottom: "var(--space-2)",
            }}
          />
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button size="sm" onClick={saveAnnotation} loading={loading} style={{ flex: 1, justifyContent: "center" }}>
              Save
            </Button>
            <Button size="sm" variant="ghost" onClick={onClose}
              style={{ color: "var(--color-paper)", flex: 1, justifyContent: "center" }}
            >
              Cancel
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
