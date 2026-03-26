"use client";

import { forwardRef } from "react";

type Variant = "primary" | "secondary" | "danger" | "ghost";
type Size    = "sm" | "md";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  loading?: boolean;
}

const STYLES: Record<Variant, React.CSSProperties> = {
  primary: {
    background:   "var(--color-accent)",
    color:        "white",
    border:       "none",
  },
  secondary: {
    background:   "transparent",
    color:        "var(--color-ink)",
    border:       "1px solid var(--color-paper-darker)",
  },
  danger: {
    background:   "var(--color-error)",
    color:        "white",
    border:       "none",
  },
  ghost: {
    background:   "transparent",
    color:        "var(--color-ink-light)",
    border:       "none",
  },
};

const SIZES: Record<Size, React.CSSProperties> = {
  sm: { padding: "var(--space-2) var(--space-4)", fontSize: "var(--text-xs)" },
  md: { padding: "var(--space-3) var(--space-6)", fontSize: "var(--text-sm)" },
};

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, disabled, children, style, ...props }, ref) => {
    const isDisabled = disabled || loading;

    return (
      <button
        ref={ref}
        disabled={isDisabled}
        style={{
          display:      "inline-flex",
          alignItems:   "center",
          gap:          "var(--space-2)",
          fontFamily:   "var(--font-sans)",
          fontWeight:   "var(--font-semibold)",
          borderRadius: "var(--radius-md)",
          cursor:       isDisabled ? "not-allowed" : "pointer",
          transition:   "all 150ms ease",
          opacity:      isDisabled ? 0.55 : 1,
          whiteSpace:   "nowrap",
          lineHeight:   1,
          ...STYLES[variant],
          ...SIZES[size],
          ...style,
        }}
        {...props}
      >
        {loading && (
          <span
            style={{
              width:  "12px",
              height: "12px",
              border: "2px solid currentColor",
              borderTopColor: "transparent",
              borderRadius: "50%",
              animation: "spin 0.6s linear infinite",
              flexShrink: 0,
            }}
          />
        )}
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
export default Button;
