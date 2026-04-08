"use client";

import { useEffect, useRef, useState } from "react";
import { Upload, FileText, Camera } from "lucide-react";
import Modal from "./Modal";
import Button from "./Button";
import { importArticle } from "@/lib/api";
import { isNative } from "@/lib/capacitor";
import type { ArticleImportResponse } from "@/lib/types";

const SUPPORTED = ".txt, .md, .pdf, .docx, .epub";

type Tab = "file" | "text" | "camera";

interface ImportModalProps {
  open: boolean;
  onClose: () => void;
  onSuccess: (article: ArticleImportResponse) => void;
  /** Called when the user chooses "Open Camera" on native. Parent should close
   *  this modal and open CameraImportModal. */
  onCameraRequest?: () => void;
}

export default function ImportModal({ open, onClose, onSuccess, onCameraRequest }: ImportModalProps) {
  const [tab, setTab]               = useState<Tab>("file");
  const [file, setFile]             = useState<File | null>(null);
  const [dragging, setDragging]     = useState(false);
  const [pasteText, setPasteText]   = useState("");
  const [title, setTitle]           = useState("");
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [native, setNative]         = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Detect native on mount (client-side only)
  useEffect(() => { setNative(isNative()); }, []);

  function reset() {
    setFile(null);
    setPasteText("");
    setTitle("");
    setError(null);
    setTab("file");
  }

  function handleClose() { reset(); onClose(); }

  // ── File drag & drop ─────────────────────────────────────
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    setDragging(false);
    const f = e.dataTransfer.files[0];
    if (f) setFile(f);
  }

  // ── Submit ───────────────────────────────────────────────
  async function handleSubmit() {
    setError(null);
    const fd = new FormData();

    if (tab === "file") {
      if (!file) { setError("Please select a file."); return; }
      fd.append("file", file);
    } else {
      if (!pasteText.trim()) { setError("Please enter some text."); return; }
      fd.append("text", pasteText);
    }
    if (title.trim()) fd.append("title", title.trim());

    setLoading(true);
    try {
      const result = await importArticle(fd);
      reset();
      onSuccess(result);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Import failed.");
    } finally {
      setLoading(false);
    }
  }

  // ── Shared input style ───────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width:        "100%",
    fontFamily:   "var(--font-sans)",
    fontSize:     "var(--text-sm)",
    color:        "var(--color-ink)",
    background:   "var(--color-paper)",
    border:       "1px solid var(--color-paper-darker)",
    borderRadius: "var(--radius-md)",
    padding:      "var(--space-3) var(--space-4)",
    outline:      "none",
    transition:   "border-color 150ms ease",
  };

  const TABS: { key: Tab; label: string }[] = [
    { key: "file",   label: "Upload File" },
    { key: "text",   label: "Paste Text"  },
    ...(native ? [{ key: "camera" as Tab, label: "Scan" }] : []),
  ];

  return (
    <Modal open={open} onClose={handleClose} title="Import Article">
      {/* Tabs */}
      <div style={{ display: "flex", gap: "var(--space-1)", marginBottom: "var(--space-6)", borderBottom: "1px solid var(--color-paper-darker)" }}>
        {TABS.map(({ key, label }) => (
          <button
            key={key}
            onClick={() => { setError(null); setTab(key); }}
            style={{
              fontFamily:   "var(--font-sans)",
              fontSize:     "var(--text-sm)",
              fontWeight:   tab === key ? "var(--font-semibold)" : "var(--font-regular)",
              color:        tab === key ? "var(--color-accent)" : "var(--color-ink-light)",
              background:   "transparent",
              border:       "none",
              borderBottom: tab === key ? "2px solid var(--color-accent)" : "2px solid transparent",
              padding:      "var(--space-2) var(--space-4)",
              cursor:       "pointer",
              transition:   "all 150ms ease",
              marginBottom: "-1px",
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* File tab */}
      {tab === "file" && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={onDrop}
          onClick={() => fileInputRef.current?.click()}
          style={{
            border:       `2px dashed ${dragging ? "var(--color-accent)" : "var(--color-paper-darker)"}`,
            borderRadius: "var(--radius-lg)",
            padding:      "var(--space-10) var(--space-6)",
            textAlign:    "center",
            cursor:       "pointer",
            background:   dragging ? "var(--color-accent-faint)" : "transparent",
            transition:   "all 150ms ease",
            marginBottom: "var(--space-4)",
          }}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept=".txt,.md,.pdf,.docx,.epub"
            style={{ display: "none" }}
            onChange={(e) => setFile(e.target.files?.[0] ?? null)}
          />
          <Upload size={32} style={{ color: "var(--color-ink-faint)", margin: "0 auto var(--space-3)", display: "block" }} />
          {file ? (
            <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-accent)", fontWeight: "var(--font-semibold)" }}>
              {file.name}
            </p>
          ) : (
            <>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink)", marginBottom: "var(--space-1)" }}>
                Drop a file here, or click to browse
              </p>
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-faint)" }}>
                {SUPPORTED}
              </p>
            </>
          )}
        </div>
      )}

      {/* Paste tab */}
      {tab === "text" && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="Paste your text here…"
            rows={8}
            style={{ ...inputStyle, resize: "vertical", marginBottom: "var(--space-3)" }}
          />
        </div>
      )}

      {/* Camera tab — launches CameraImportModal inline */}
      {tab === "camera" && (
        <div style={{ textAlign: "center", padding: "var(--space-10) var(--space-6)", marginBottom: "var(--space-4)" }}>
          <Camera size={40} style={{ color: "var(--color-ink-faint)", margin: "0 auto var(--space-4)", display: "block" }} />
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", marginBottom: "var(--space-6)", lineHeight: "var(--leading-normal)" }}>
            Point your camera at printed or handwritten text.<br />
            Tesseract will extract the words for you to review.
          </p>
          <Button onClick={() => { handleClose(); onCameraRequest?.(); }}>
            <Camera size={15} />
            Open Camera
          </Button>
        </div>
      )}

      {/* Optional title — shown for file and text tabs */}
      {tab !== "camera" && (
        <div style={{ marginBottom: "var(--space-4)" }}>
          <label style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "block", marginBottom: "var(--space-2)" }}>
            Title <span style={{ color: "var(--color-ink-faint)" }}>(optional)</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Derived from file name or first line if left blank"
            style={inputStyle}
          />
        </div>
      )}

      {/* Error */}
      {error && (
        <div style={{ background: "var(--color-error-light)", color: "var(--color-error)", borderRadius: "var(--radius-md)", padding: "var(--space-3) var(--space-4)", fontSize: "var(--text-sm)", fontFamily: "var(--font-sans)", marginBottom: "var(--space-4)" }}>
          {error}
        </div>
      )}

      {/* Actions — hidden for camera tab */}
      {tab !== "camera" && (
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
          <Button variant="secondary" onClick={handleClose} disabled={loading}>Cancel</Button>
          <Button onClick={handleSubmit} loading={loading}>
            <FileText size={15} />
            Import
          </Button>
        </div>
      )}
    </Modal>
  );
}
