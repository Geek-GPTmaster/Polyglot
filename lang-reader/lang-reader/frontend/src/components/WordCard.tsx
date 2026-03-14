"use client";

import { useEffect, useRef } from "react";
import type { WordInfo } from "@/types";

interface WordCardProps {
  word:     string;
  wordInfo: WordInfo | null;
  loading:  boolean;
  saving:   boolean;
  inVocab:  boolean;
  onClose:          () => void;
  onToggleVocab:    (word: string) => void;
}

const POS_COLOR: Record<string, { bg: string; text: string }> = {
  noun:        { bg: "#5B8DB822", text: "#5B8DB8" },
  verb:        { bg: "#8B5B9E22", text: "#8B5B9E" },
  adjective:   { bg: "#B8733322", text: "#B87333" },
  adverb:      { bg: "#3D6B4F22", text: "#3D6B4F" },
  conjunction: { bg: "#7A665022", text: "#7A6650" },
  preposition: { bg: "#7A665022", text: "#7A6650" },
  pronoun:     { bg: "#B85B6A22", text: "#B85B6A" },
  article:     { bg: "#88888822", text: "#888888" },
  n:   { bg: "#5B8DB822", text: "#5B8DB8" },
  v:   { bg: "#8B5B9E22", text: "#8B5B9E" },
  adj: { bg: "#B8733322", text: "#B87333" },
  adv: { bg: "#3D6B4F22", text: "#3D6B4F" },
};

export default function WordCard({
  word, wordInfo, loading, saving, inVocab, onClose, onToggleVocab,
}: WordCardProps) {
  const ref = useRef<HTMLDivElement>(null);

  // 点卡片外部 → 关闭
  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose();
    };
    const t = setTimeout(() => document.addEventListener("mousedown", h), 60);
    return () => { clearTimeout(t); document.removeEventListener("mousedown", h); };
  }, [onClose]);

  // ESC → 关闭
  useEffect(() => {
    const h = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", h);
    return () => document.removeEventListener("keydown", h);
  }, [onClose]);

  return (
    <>
      {/* 半透明遮罩 */}
      <div
        className="animate-fade-in"
        onClick={onClose}
        style={{
          position: "fixed", inset: 0,
          background: "rgba(30,27,22,0.18)",
          zIndex: 90,
        }}
      />

      {/* 底部抽屉卡片 */}
      <div
        ref={ref}
        className="animate-slide-up"
        style={{
          position: "fixed", bottom: 0,
          left: "50%", transform: "translateX(-50%)",
          width: "100%", maxWidth: "640px",
          background: "var(--card-bg)",
          borderRadius: "20px 20px 0 0",
          boxShadow: "var(--shadow-lg)",
          zIndex: 100,
          overflow: "hidden",
        }}
      >
        {/* 拖拽把手 */}
        <div style={{
          width: 36, height: 4, background: "var(--border)",
          borderRadius: 2, margin: "12px auto 0",
        }} />

        {/* 头部：单词 + 音标 + 关闭 */}
        <div style={{
          padding: "0.9rem 1.5rem 0.75rem",
          display: "flex", alignItems: "flex-start", justifyContent: "space-between",
          borderBottom: "1px solid var(--border)",
        }}>
          <div>
            <h3 style={{
              fontFamily: "var(--font-display)", fontSize: "1.7rem",
              fontWeight: 600, color: "var(--ink)", margin: 0, letterSpacing: "-0.01em",
            }}>
              {word}
            </h3>
            {wordInfo?.phonetic && !loading && (
              <span style={{
                fontFamily: "var(--font-ui)", fontSize: "0.82rem",
                color: "var(--ink-3)", fontWeight: 300, letterSpacing: "0.02em",
              }}>
                {wordInfo.phonetic}
              </span>
            )}
          </div>

          <button
            onClick={onClose}
            aria-label="关闭"
            style={{
              width: 30, height: 30, borderRadius: "50%",
              border: "none", background: "var(--paper-dark)",
              cursor: "pointer", display: "flex",
              alignItems: "center", justifyContent: "center",
              color: "var(--ink-3)", fontSize: "1.1rem",
              transition: "background .15s", flexShrink: 0,
            }}
            onMouseEnter={(e) => (e.currentTarget.style.background = "var(--border)")}
            onMouseLeave={(e) => (e.currentTarget.style.background = "var(--paper-dark)")}
          >
            ×
          </button>
        </div>

        {/* 内容区 */}
        <div style={{ padding: "1rem 1.5rem 0", minHeight: "80px" }}>
          {/* 加载中 */}
          {loading && (
            <div style={{ padding: "1.25rem 0", display: "flex", justifyContent: "center" }}>
              <LoadingDots />
            </div>
          )}

          {/* 未找到 */}
          {!loading && !wordInfo && (
            <p style={{
              fontFamily: "var(--font-ui)", fontSize: "0.88rem",
              color: "var(--ink-3)", padding: "0.75rem 0",
            }}>
              未找到「{word}」的释义
            </p>
          )}

          {/* 释义列表 */}
          {!loading && wordInfo && (
            <div>
              {wordInfo.definitions.map((def, i) => {
                const color = POS_COLOR[def.pos.toLowerCase()] ?? { bg: "#88888818", text: "#888" };
                const isLast = i === wordInfo.definitions.length - 1;
                return (
                  <div
                    key={i}
                    style={{
                      marginBottom: isLast ? 0 : "1rem",
                      paddingBottom: isLast ? 0 : "1rem",
                      borderBottom: isLast ? "none" : "1px solid var(--border)",
                    }}
                  >
                    {/* 词性标签 */}
                    <span style={{
                      display: "inline-block",
                      fontFamily: "var(--font-ui)", fontSize: "0.68rem",
                      fontWeight: 500, letterSpacing: "0.07em",
                      textTransform: "uppercase",
                      padding: "0.15rem 0.5rem", borderRadius: "4px",
                      background: color.bg, color: color.text,
                      marginBottom: "0.4rem",
                    }}>
                      {def.pos}
                    </span>

                    {/* 中文释义 */}
                    <p style={{
                      fontFamily: "var(--font-ui)", fontSize: "1rem",
                      color: "var(--ink)", margin: "0 0 0.35rem", lineHeight: 1.5,
                    }}>
                      {def.meaning}
                    </p>

                    {/* 例句 */}
                    {def.example && (
                      <p style={{
                        fontFamily: "var(--font-serif)", fontSize: "0.9rem",
                        fontStyle: "italic", color: "var(--ink-3)",
                        margin: 0, lineHeight: 1.65,
                        paddingLeft: "0.75rem",
                        borderLeft: "2px solid var(--border)",
                      }}>
                        {def.example}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* 底部操作 */}
        <div style={{ padding: "0.875rem 1.5rem 1.75rem" }}>
          <button
            onClick={() => onToggleVocab(word)}
            disabled={saving || loading}
            style={{
              width: "100%",
              padding: "0.7rem",
              borderRadius: "10px",
              border: inVocab ? "1.5px solid var(--accent)" : "1.5px solid var(--border)",
              background: inVocab ? "var(--accent)" : "transparent",
              color: inVocab ? "#fff" : "var(--ink-2)",
              fontFamily: "var(--font-ui)", fontSize: "0.9rem", fontWeight: 500,
              cursor: saving ? "wait" : "pointer",
              transition: "all .2s ease",
              display: "flex", alignItems: "center", justifyContent: "center", gap: "0.45rem",
              opacity: saving ? 0.7 : 1,
            }}
          >
            {saving ? (
              <LoadingDots />
            ) : inVocab ? (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M2 7L6 11L12 3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
                已加入生词本 · 点击移除
              </>
            ) : (
              <>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M7 2V12M2 7H12" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"/>
                </svg>
                加入生词本
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
}

function LoadingDots() {
  return (
    <span style={{ display: "inline-flex", gap: 5, alignItems: "center" }}>
      {[0, 1, 2].map((i) => (
        <span key={i} style={{
          width: 6, height: 6, borderRadius: "50%",
          background: "var(--ink-3)",
          display: "inline-block",
          animation: "dotPulse 1.2s ease-in-out infinite",
          animationDelay: `${i * 0.2}s`,
        }} />
      ))}
      <style>{`@keyframes dotPulse{0%,80%,100%{opacity:.2;transform:scale(.8)}40%{opacity:1;transform:scale(1)}}`}</style>
    </span>
  );
}
