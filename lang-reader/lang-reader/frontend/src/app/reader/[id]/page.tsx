"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import ArticleReader from "@/components/ArticleReader";
import WordCard from "@/components/WordCard";
import type { WordInfo } from "@/types";
import { mockLookupWord } from "@/lib/mockDictionary";
import { getVocabulary, addToVocabulary, removeFromVocabulary } from "@/lib/api";

export default function ReaderPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();

  const [content, setContent]         = useState<string>("");
  const [title, setTitle]             = useState<string>("");
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [wordInfo, setWordInfo]       = useState<WordInfo | null>(null);
  const [cardLoading, setCardLoading] = useState(false);
  const [vocabSet, setVocabSet]       = useState<Set<string>>(new Set());
  const [vocabLoading, setVocabLoading] = useState(false);

  // ── 加载文章 ──────────────────────────────────────────────
  useEffect(() => {
    if (id === "draft") {
      const stored = sessionStorage.getItem("draft_article");
      if (!stored) { router.push("/"); return; }
      setContent(stored);
      const firstLine = stored.split("\n")[0].trim();
      setTitle(firstLine.length > 50 ? firstLine.slice(0, 50) + "…" : firstLine);
    }
  }, [id, router]);

  // ── 从后端加载生词本（初始化 vocabSet）────────────────────
  useEffect(() => {
    getVocabulary()
      .then((words) => setVocabSet(new Set(words.map((w) => w.word))))
      .catch(() => {
        // 后端未启动时降级用 localStorage
        try {
          const saved = localStorage.getItem("vocab_set_fallback");
          if (saved) setVocabSet(new Set(JSON.parse(saved)));
        } catch {}
      });
  }, []);

  // ── 点击单词 ──────────────────────────────────────────────
  const handleWordClick = useCallback(async (word: string) => {
    if (selectedWord === word) {
      setSelectedWord(null);
      setWordInfo(null);
      return;
    }
    setSelectedWord(word);
    setWordInfo(null);
    setCardLoading(true);
    const info = await mockLookupWord(word);
    setWordInfo(info);
    setCardLoading(false);
  }, [selectedWord]);

  const handleCloseCard = () => {
    setSelectedWord(null);
    setWordInfo(null);
  };

  // ── 加入 / 移出生词本 ─────────────────────────────────────
  const handleToggleVocab = useCallback(async (word: string) => {
    if (!wordInfo) return;
    setVocabLoading(true);
    try {
      if (vocabSet.has(word)) {
        await removeFromVocabulary(word);
        setVocabSet((prev) => { const s = new Set(prev); s.delete(word); return s; });
      } else {
        await addToVocabulary(word, wordInfo.phonetic, wordInfo.definitions);
        setVocabSet((prev) => new Set(prev).add(word));
      }
    } catch (e) {
      console.error("vocab error:", e);
      // 降级：只更新本地状态，不报错给用户
      const s = new Set(vocabSet);
      vocabSet.has(word) ? s.delete(word) : s.add(word);
      setVocabSet(s);
      localStorage.setItem("vocab_set_fallback", JSON.stringify([...s]));
    } finally {
      setVocabLoading(false);
    }
  }, [wordInfo, vocabSet]);

  const wordCount = content ? content.trim().split(/\s+/).length : 0;

  if (!content) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100vh" }}>
        <p style={{ fontFamily: "var(--font-ui)", color: "var(--ink-3)" }}>加载中…</p>
      </div>
    );
  }

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>

      {/* ── 顶栏 ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 50,
        background: "rgba(247,243,236,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 1.5rem", height: "52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => router.push("/")}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            fontFamily: "var(--font-ui)", fontSize: "0.82rem",
            color: "var(--ink-3)", background: "none", border: "none",
            cursor: "pointer", padding: "0.3rem 0.5rem", borderRadius: "6px",
            transition: "color .15s, background .15s",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--paper-dark)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "none"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          返回
        </button>

        <span style={{
          fontFamily: "var(--font-display)", fontSize: "0.9rem", fontWeight: 500,
          color: "var(--ink-2)", position: "absolute", left: "50%",
          transform: "translateX(-50%)", maxWidth: "360px",
          overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap",
        }}>
          {title}
        </span>

        <button
          onClick={() => router.push("/vocabulary")}
          style={{
            display: "flex", alignItems: "center", gap: "0.35rem",
            fontFamily: "var(--font-ui)", fontSize: "0.82rem",
            color: vocabSet.size > 0 ? "var(--accent)" : "var(--ink-3)",
            background: vocabSet.size > 0 ? "var(--accent-light)" : "none",
            border: "none", cursor: "pointer", padding: "0.3rem 0.65rem",
            borderRadius: "6px", transition: "all .15s",
          }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M7 2L8.5 5.5L12 6L9.5 8.5L10.1 12L7 10.3L3.9 12L4.5 8.5L2 6L5.5 5.5L7 2Z"
              stroke="currentColor" strokeWidth="1.2"
              fill={vocabSet.size > 0 ? "var(--accent)" : "none"}
              strokeLinejoin="round"/>
          </svg>
          生词本 {vocabSet.size > 0 && `(${vocabSet.size})`}
        </button>
      </header>

      {/* ── 正文 ── */}
      <main style={{ maxWidth: "var(--reader-width)", margin: "0 auto", padding: "3rem 2rem 12rem" }}>
        <div className="animate-fade-up" style={{ marginBottom: "2.5rem" }}>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--ink-3)",
            fontWeight: 300, letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "0.25rem",
          }}>
            {wordCount.toLocaleString()} words · 点击任意单词查看释义
          </p>
          <div style={{ width: "2rem", height: "2px", background: "var(--accent)", borderRadius: "1px", opacity: 0.6 }} />
        </div>

        <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
          <ArticleReader
            content={content}
            selectedWord={selectedWord}
            vocabSet={vocabSet}
            onWordClick={handleWordClick}
          />
        </div>
      </main>

      {/* ── 词卡 ── */}
      {selectedWord && (
        <WordCard
          word={selectedWord}
          wordInfo={wordInfo}
          loading={cardLoading}
          saving={vocabLoading}
          inVocab={vocabSet.has(selectedWord)}
          onClose={handleCloseCard}
          onToggleVocab={handleToggleVocab}
        />
      )}
    </div>
  );
}
