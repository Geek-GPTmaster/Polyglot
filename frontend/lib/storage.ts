"use client";

import type { FontSize } from "./types";

const LANG_KEY     = "polyglot_active_language";
const FONTSIZE_KEY = "polyglot_font_size";

// ---------------------------------------------------------------------------
// Active language
// ---------------------------------------------------------------------------

export function getActiveLang(): string {
  if (typeof window === "undefined") return "en";
  return localStorage.getItem(LANG_KEY) ?? "en";
}

export function setActiveLang(code: string): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(LANG_KEY, code);
}

// ---------------------------------------------------------------------------
// Reading font size
// ---------------------------------------------------------------------------

export function getFontSize(): FontSize {
  if (typeof window === "undefined") return "medium";
  const stored = localStorage.getItem(FONTSIZE_KEY);
  if (stored === "small" || stored === "medium" || stored === "large") {
    return stored;
  }
  return "medium";
}

export function setFontSize(size: FontSize): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(FONTSIZE_KEY, size);
}
