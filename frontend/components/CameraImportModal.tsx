"use client";

import { useState } from "react";
import { Camera, Loader2, CheckCircle2 } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { captureAndOCR, type OcrProgress } from "@/lib/camera";
import { importArticle } from "@/lib/api";
import { useToast } from "./Toast";
import type { ArticleImportResponse } from "@/lib/types";

// ---------------------------------------------------------------------------
// Progress bar
// ---------------------------------------------------------------------------

function OcrProgressBar({ progress }: { progress: number }) {
  return (
    <div
      style={{
        background:   "var(--color-paper-darker)",
        borderRadius: "var(--radius-full)",
        height:       "6px",
        overflow:     "hidden",
        marginTop:    "var(--space-2)",
      }}
    >
      <div
        style={{
          height:     "100%",
          width:      `${Math.round(progress * 100)}%`,
          background: "var(--color-accent)",
          borderRadius: "var(--radius-full)",
          transition: "width 200ms ease",
        }}
      />
    </div>
  );
}

// ---------------------------------------------------------------------------
// States
// ---------------------------------------------------------------------------

type Stage =
  | "idle"         // waiting for user to tap "Scan"
  | "capturing"    // camera is open
  | "processing"   // OCR running
  | "review"       // show extracted text for user confirmation
  | "importing"    // POST to API
  | "done";

export default function CameraImportModal({
  open,
  onClose,
  onSuccess,
  language,
}: {
  open: boolean;
  onClose: () => void;
  onSuccess: (article: ArticleImportResponse) => void;
  language: string;
}) {
  const { toast } = useToast();

  const [stage, setStage]       = useState<Stage>("idle");
  const [ocrText, setOcrText]   = useState("");
  const [ocrPct, setOcrPct]     = useState(0);
  const [title, setTitle]       = useState("");

  function reset() {
    setStage("idle");
    setOcrText("");
    setOcrPct(0);
    setTitle("");
  }

  async function handleScan() {
    setStage("capturing");
    try {
      const text = await captureAndOCR(language, (p: OcrProgress) => {
        setStage("processing");
        setOcrPct(p.progress);
      });
      if (text === null) { setStage("idle"); return; } // cancelled
      setOcrText(text);
      setStage("review");
    } catch (err) {
      toast("Camera error — " + (err instanceof Error ? err.message : "unknown"), "error");
      setStage("idle");
    }
  }

  async function handleImport() {
    if (!ocrText.trim()) return;
    setStage("importing");
    try {
      const fd = new FormData();
      const blob = new Blob([ocrText], { type: "text/plain" });
      fd.append("file", blob, (title.trim() || "Camera scan") + ".txt");
      if (title.trim()) fd.append("title", title.trim());
      const article = await importArticle(fd);
      setStage("done");
      toast(`"${article.title}" imported.`);
      onSuccess(article);
      reset();
    } catch {
      toast("Failed to import.", "error");
      setStage("review");
    }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
    color: "var(--color-ink)", background: "var(--color-paper)",
    border: "1px solid var(--color-paper-darker)", borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)", outline: "none",
  };

  return (
    <Modal
      open={open}
      onClose={() => { reset(); onClose(); }}
      title="Scan Article"
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>

        {/* ── Idle ── */}
        {stage === "idle" && (
          <>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", lineHeight: "var(--leading-normal)" }}>
              Point your camera at printed or handwritten text. Tesseract will extract the text, then you can review before importing.
            </p>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
              <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
              <Button onClick={handleScan}>
                <Camera size={15} />
                Open Camera
              </Button>
            </div>
          </>
        )}

        {/* ── Capturing (camera UI is native; just show a spinner) ── */}
        {stage === "capturing" && (
          <div style={{ textAlign: "center", padding: "var(--space-8)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)" }}>
            <Loader2 size={32} style={{ margin: "0 auto var(--space-3)", display: "block", animation: "spin 1s linear infinite" }} />
            Opening camera…
          </div>
        )}

        {/* ── OCR processing ── */}
        {stage === "processing" && (
          <div style={{ padding: "var(--space-4) 0" }}>
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", marginBottom: "var(--space-2)" }}>
              Recognising text… {Math.round(ocrPct * 100)}%
            </p>
            <OcrProgressBar progress={ocrPct} />
          </div>
        )}

        {/* ── Review extracted text ── */}
        {stage === "review" && (
          <>
            <div>
              <label style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "block", marginBottom: "var(--space-2)" }}>
                Title <span style={{ color: "var(--color-ink-faint)" }}>(optional)</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Article title…"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "block", marginBottom: "var(--space-2)" }}>
                Extracted text — review and edit before importing
              </label>
              <textarea
                value={ocrText}
                onChange={(e) => setOcrText(e.target.value)}
                rows={10}
                style={{ ...inputStyle, resize: "vertical", lineHeight: "var(--leading-relaxed)" }}
              />
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "var(--space-3)", flexWrap: "wrap" }}>
              <Button variant="secondary" onClick={() => setStage("idle")}>
                <Camera size={14} />
                Re-scan
              </Button>
              <div style={{ display: "flex", gap: "var(--space-3)" }}>
                <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
                <Button onClick={handleImport} disabled={!ocrText.trim()}>Import</Button>
              </div>
            </div>
          </>
        )}

        {/* ── Importing ── */}
        {stage === "importing" && (
          <div style={{ textAlign: "center", padding: "var(--space-8)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)" }}>
            <Loader2 size={32} style={{ margin: "0 auto var(--space-3)", display: "block", animation: "spin 1s linear infinite" }} />
            Importing article…
          </div>
        )}

        {/* ── Done ── */}
        {stage === "done" && (
          <div style={{ textAlign: "center", padding: "var(--space-8)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-accent)" }}>
            <CheckCircle2 size={32} style={{ margin: "0 auto var(--space-3)", display: "block" }} />
            Imported successfully!
          </div>
        )}
      </div>
    </Modal>
  );
}
