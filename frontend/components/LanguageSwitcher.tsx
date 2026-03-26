"use client";

import { useLanguage } from "@/lib/context/LanguageContext";

export default function LanguageSwitcher() {
  const { activeLang, setActiveLang, languages, loading } = useLanguage();

  if (loading || languages.length === 0) return null;

  return (
    <div className="flex items-center gap-1">
      {languages.map((lang) => {
        const isActive = lang.code === activeLang;
        return (
          <button
            key={lang.code}
            onClick={() => setActiveLang(lang.code)}
            style={{
              fontFamily:   "var(--font-sans)",
              fontSize:     "var(--text-xs)",
              fontWeight:   "var(--font-semibold)",
              padding:      "var(--space-1) var(--space-3)",
              borderRadius: "var(--radius-full)",
              border:       "none",
              cursor:       "pointer",
              transition:   "all 150ms ease",
              background:   isActive ? "var(--color-accent)" : "transparent",
              color:        isActive ? "white"                : "var(--color-ink-light)",
            }}
            aria-pressed={isActive}
            aria-label={`Switch to ${lang.name}`}
          >
            {lang.native_name}
          </button>
        );
      })}
    </div>
  );
}
