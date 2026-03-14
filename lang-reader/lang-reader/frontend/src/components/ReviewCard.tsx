/**
 * ReviewCard.tsx — 复习翻转卡片
 * 正面：单词 + 音标 + 提示
 * 背面：释义列表 + 例句（点击翻转后出现）
 * 带 CSS 3D flip 动画
 */
"use client";

import type { VocabularyWord } from "@/types";

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

interface ReviewCardProps {
  word:    VocabularyWord;
  flipped: boolean;
  onFlip:  () => void;
}

export default function ReviewCard({ word, flipped, onFlip }: ReviewCardProps) {
  return (
    <>
      <style>{`
        .flip-container { perspective: 1000px; }
        .flip-inner {
          position: relative;
          width: 100%;
          transition: transform 0.5s cubic-bezier(0.16,1,0.3,1);
          transform-style: preserve-3d;
        }
        .flip-inner.flipped { transform: rotateY(180deg); }
        .flip-face {
          backface-visibility: hidden;
          -webkit-backface-visibility: hidden;
        }
        .flip-back { transform: rotateY(180deg); }
      `}</style>

      <div
        className="flip-container"
        style={{ width: "100%", minHeight: "260px", cursor: flipped ? "default" : "pointer" }}
        onClick={!flipped ? onFlip : undefined}
      >
        <div className={`flip-inner${flipped ? " flipped" : ""}`} style={{ minHeight: "260px" }}>

          {/* ── 正面：单词 + 音标 ── */}
          <div
            className="flip-face"
            style={{
              position: "absolute", inset: 0,
              background: "var(--card-bg)",
              border: "1px solid var(--border)",
              borderRadius: "16px",
              boxShadow: "var(--shadow-md)",
              display: "flex", flexDirection: "column",
              alignItems: "center", justifyContent: "center",
              gap: "0.6rem", padding: "2.5rem 2rem",
            }}
          >
            <h2 style={{
              fontFamily: "var(--font-display)",
              fontSize: "clamp(1.8rem, 6vw, 2.6rem)",
              fontWeight: 600, color: "var(--ink)",
              margin: 0, letterSpacing: "-0.02em",
            }}>
              {word.word}
            </h2>

            {word.phonetic && (
              <span style={{
                fontFamily: "var(--font-ui)", fontSize: "1rem",
                color: "var(--ink-3)", fontWeight: 300, letterSpacing: "0.03em",
              }}>
                {word.phonetic}
              </span>
            )}

            <div style={{
              marginTop: "1.25rem",
              display: "flex", alignItems: "center", gap: "0.4rem",
              color: "var(--ink-3)", fontFamily: "var(--font-ui)",
              fontSize: "0.78rem", fontWeight: 300,
            }}>
              <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                <path d="M7 1v6l3 2" stroke="currentColor" strokeWidth="1.4"
                  strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
              点击翻转查看释义
            </div>
          </div>

          {/* ── 背面：释义 + 例句 ── */}
          <div
            className="flip-face flip-back"
            style={{
              position: "absolute", inset: 0,
              background: "var(--card-bg)",
              border: "1px solid var(--accent)",
              borderRadius: "16px",
              boxShadow: "0 0 0 3px var(--accent-glow), var(--shadow-md)",
              padding: "1.5rem 1.75rem",
              overflowY: "auto",
            }}
          >
            {/* 小单词标题 */}
            <p style={{
              fontFamily: "var(--font-display)", fontSize: "0.95rem",
              fontWeight: 500, color: "var(--ink-2)",
              margin: "0 0 1rem", letterSpacing: "0.01em",
            }}>
              {word.word}
              {word.phonetic && (
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--ink-3)", marginLeft: "0.5rem", fontWeight: 300 }}>
                  {word.phonetic}
                </span>
              )}
            </p>

            {word.definitions.map((def, i) => {
              const c = POS_COLOR[def.pos.toLowerCase()] ?? { bg: "#88888818", text: "#888" };
              const isLast = i === word.definitions.length - 1;
              return (
                <div key={i} style={{
                  marginBottom: isLast ? 0 : "1rem",
                  paddingBottom: isLast ? 0 : "1rem",
                  borderBottom: isLast ? "none" : "1px solid var(--border)",
                }}>
                  <span style={{
                    display: "inline-block",
                    fontFamily: "var(--font-ui)", fontSize: "0.65rem",
                    fontWeight: 500, letterSpacing: "0.07em",
                    textTransform: "uppercase",
                    padding: "0.12rem 0.45rem", borderRadius: "4px",
                    background: c.bg, color: c.text, marginBottom: "0.4rem",
                  }}>
                    {def.pos}
                  </span>

                  <p style={{
                    fontFamily: "var(--font-ui)", fontSize: "1rem",
                    color: "var(--ink)", margin: "0 0 0.35rem", lineHeight: 1.5,
                  }}>
                    {def.meaning}
                  </p>

                  {def.example && (
                    <p style={{
                      fontFamily: "var(--font-serif)", fontSize: "0.875rem",
                      fontStyle: "italic", color: "var(--ink-3)",
                      margin: 0, lineHeight: 1.65,
                      paddingLeft: "0.65rem",
                      borderLeft: "2px solid var(--border)",
                    }}>
                      {def.example}
                    </p>
                  )}
                </div>
              );
            })}
          </div>

        </div>
      </div>
    </>
  );
}
