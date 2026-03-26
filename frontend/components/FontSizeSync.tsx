"use client";

import { useEffect } from "react";
import { getFontSize } from "@/lib/storage";

/**
 * Reads the persisted font-size preference from localStorage on first render
 * and applies it as a data attribute on <body>, which globals.css uses to
 * set --article-font-size. Must be mounted inside <body> (done in layout.tsx).
 */
export default function FontSizeSync() {
  useEffect(() => {
    document.body.dataset.fontSize = getFontSize();
  }, []);
  return null;
}
