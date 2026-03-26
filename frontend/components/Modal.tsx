"use client";

import { useEffect, useRef } from "react";
import { X } from "lucide-react";

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  /** Override the default max-width (480px) */
  maxWidth?: string;
}

export default function Modal({
  open,
  onClose,
  title,
  children,
  maxWidth = "var(--max-width-narrow)",
}: ModalProps) {
  const dialogRef = useRef<HTMLDivElement>(null);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [open, onClose]);

  // Trap scroll
  useEffect(() => {
    if (open) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [open]);

  if (!open) return null;

  return (
    <div
      style={{
        position:       "fixed",
        inset:          0,
        background:     "rgba(44, 36, 22, 0.5)",
        backdropFilter: "blur(2px)",
        display:        "flex",
        alignItems:     "center",
        justifyContent: "center",
        zIndex:         200,
        padding:        "var(--space-4)",
        animation:      "fadeIn 150ms ease-out",
      }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div
        ref={dialogRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={title ? "modal-title" : undefined}
        style={{
          background:   "var(--color-paper)",
          borderRadius: "var(--radius-xl)",
          boxShadow:    "var(--shadow-lg)",
          width:        "90vw",
          maxWidth,
          maxHeight:    "90vh",
          overflowY:    "auto",
          padding:      "var(--space-8)",
          animation:    "scaleIn 200ms ease-out",
          position:     "relative",
        }}
      >
        {/* Header */}
        {(title != null) && (
          <div
            style={{
              display:        "flex",
              alignItems:     "center",
              justifyContent: "space-between",
              marginBottom:   "var(--space-6)",
            }}
          >
            <h2
              id="modal-title"
              style={{
                fontFamily: "var(--font-serif)",
                fontSize:   "var(--text-xl)",
                fontWeight: "var(--font-semibold)",
                color:      "var(--color-ink)",
                margin:     0,
              }}
            >
              {title}
            </h2>
            <button
              onClick={onClose}
              aria-label="Close modal"
              style={{
                background:   "transparent",
                border:       "none",
                cursor:       "pointer",
                color:        "var(--color-ink-light)",
                padding:      "var(--space-2)",
                borderRadius: "var(--radius-sm)",
                display:      "flex",
                transition:   "all 150ms ease",
              }}
            >
              <X size={20} />
            </button>
          </div>
        )}

        {children}
      </div>

      <style>{`
        @keyframes fadeIn  { from { opacity: 0 } to { opacity: 1 } }
        @keyframes scaleIn { from { opacity: 0; transform: scale(0.96) } to { opacity: 1; transform: scale(1) } }
        @keyframes spin    { to { transform: rotate(360deg) } }
      `}</style>
    </div>
  );
}
