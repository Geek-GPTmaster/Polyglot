"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { X } from "lucide-react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type ToastType = "success" | "error" | "info";

interface ToastItem {
  id: number;
  message: string;
  type: ToastType;
}

interface ToastContextValue {
  toast: (message: string, type?: ToastType) => void;
}

// ---------------------------------------------------------------------------
// Context
// ---------------------------------------------------------------------------

const ToastContext = createContext<ToastContextValue>({ toast: () => {} });

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counter = useRef(0);

  const toast = useCallback((message: string, type: ToastType = "success") => {
    const id = ++counter.current;
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3000);
  }, []);

  const dismiss = (id: number) =>
    setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container */}
      <div
        style={{
          position:      "fixed",
          bottom:        "var(--space-6)",
          right:         "var(--space-6)",
          display:       "flex",
          flexDirection: "column",
          gap:           "var(--space-2)",
          zIndex:        300,
          maxWidth:      "360px",
          width:         "calc(100vw - var(--space-12))",
        }}
      >
        {toasts.map((t) => (
          <ToastItem key={t.id} item={t} onDismiss={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

// ---------------------------------------------------------------------------
// Single toast item
// ---------------------------------------------------------------------------

function ToastItem({
  item,
  onDismiss,
}: {
  item: ToastItem;
  onDismiss: () => void;
}) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    // Tiny delay so the animation runs after mount
    const t = setTimeout(() => setVisible(true), 10);
    return () => clearTimeout(t);
  }, []);

  const bgColor =
    item.type === "error"
      ? "var(--color-error)"
      : item.type === "info"
      ? "var(--color-ink-light)"
      : "var(--color-ink)";

  return (
    <div
      style={{
        display:      "flex",
        alignItems:   "center",
        justifyContent:"space-between",
        gap:          "var(--space-3)",
        background:   bgColor,
        color:        "var(--color-paper)",
        fontFamily:   "var(--font-sans)",
        fontSize:     "var(--text-sm)",
        padding:      "var(--space-3) var(--space-5)",
        borderRadius: "var(--radius-lg)",
        boxShadow:    "var(--shadow-lg)",
        opacity:      visible ? 1 : 0,
        transform:    visible ? "translateY(0)" : "translateY(8px)",
        transition:   "opacity 200ms ease, transform 200ms ease",
      }}
    >
      <span style={{ flex: 1 }}>{item.message}</span>
      <button
        onClick={onDismiss}
        aria-label="Dismiss"
        style={{
          background: "transparent",
          border:     "none",
          cursor:     "pointer",
          color:      "inherit",
          opacity:    0.7,
          padding:    0,
          display:    "flex",
          flexShrink: 0,
        }}
      >
        <X size={14} />
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Hook
// ---------------------------------------------------------------------------

export function useToast() {
  return useContext(ToastContext);
}
