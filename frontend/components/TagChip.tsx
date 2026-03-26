"use client";

interface TagChipProps {
  label: string;
  active?: boolean;
  onClick?: () => void;
  onRemove?: () => void;
}

export default function TagChip({
  label,
  active = false,
  onClick,
  onRemove,
}: TagChipProps) {
  return (
    <span
      onClick={onClick}
      style={{
        display:      "inline-flex",
        alignItems:   "center",
        gap:          "var(--space-1)",
        fontFamily:   "var(--font-sans)",
        fontSize:     "var(--text-xs)",
        fontWeight:   "var(--font-medium)",
        padding:      "var(--space-1) var(--space-3)",
        borderRadius: "var(--radius-full)",
        border:       active
          ? "1px solid var(--color-accent)"
          : "1px solid var(--color-paper-darker)",
        background:   active
          ? "var(--color-accent-faint)"
          : "var(--color-paper-darker)",
        color:        active
          ? "var(--color-accent-dark)"
          : "var(--color-ink-light)",
        cursor:       onClick ? "pointer" : "default",
        transition:   "all 150ms ease",
        userSelect:   "none",
        whiteSpace:   "nowrap",
      }}
    >
      {label}
      {onRemove && (
        <button
          onClick={(e) => { e.stopPropagation(); onRemove(); }}
          aria-label={`Remove tag ${label}`}
          style={{
            background:  "transparent",
            border:      "none",
            cursor:      "pointer",
            color:       "inherit",
            padding:     0,
            marginLeft:  "2px",
            lineHeight:  1,
            opacity:     0.7,
            fontSize:    "0.85em",
          }}
        >
          ×
        </button>
      )}
    </span>
  );
}
