"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";
import type { Language } from "@/lib/types";
import { fetchLanguages } from "@/lib/api";
import { getActiveLang, setActiveLang as persistLang } from "@/lib/storage";

interface LanguageContextValue {
  /** The currently selected language code, e.g. "en" */
  activeLang: string;
  /** Switch the active language and persist to localStorage */
  setActiveLang: (code: string) => void;
  /** Active languages fetched from GET /api/languages */
  languages: Language[];
  /** True while the initial language fetch is in flight */
  loading: boolean;
}

const LanguageContext = createContext<LanguageContextValue>({
  activeLang: "en",
  setActiveLang: () => {},
  languages: [],
  loading: true,
});

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [activeLang, setActiveLangState] = useState<string>("en");
  const [languages, setLanguages] = useState<Language[]>([]);
  const [loading, setLoading] = useState(true);

  // Load persisted language and fetch language list on mount
  useEffect(() => {
    setActiveLangState(getActiveLang());

    fetchLanguages()
      .then((langs) => {
        setLanguages(langs);
        // Ensure persisted lang is still active; fall back to first active
        const persisted = getActiveLang();
        const isValid = langs.some((l) => l.code === persisted);
        if (!isValid && langs.length > 0) {
          setActiveLangState(langs[0].code);
          persistLang(langs[0].code);
        }
      })
      .catch(() => {
        // Backend offline — silently keep current state
      })
      .finally(() => setLoading(false));
  }, []);

  const setActiveLang = useCallback((code: string) => {
    setActiveLangState(code);
    persistLang(code);
  }, []);

  return (
    <LanguageContext.Provider value={{ activeLang, setActiveLang, languages, loading }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage(): LanguageContextValue {
  return useContext(LanguageContext);
}
