"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

const SAMPLE_TEXT = `The most important thing in communication is hearing what isn't said. Management is doing things right; leadership is doing the right things. The art of communication is the language of leadership.

In the middle of every difficulty lies opportunity. Life is what happens when you're busy making other plans. The future belongs to those who believe in the beauty of their dreams.

Knowledge is power. Time is money. An investment in knowledge pays the best interest. Education is not the filling of a pail, but the lighting of a fire.`;

export default function HomePage() {
  const router = useRouter();
  const [text, setText] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSubmit = () => {
    const content = text.trim();
    if (!content) return;
    // 将文章内容编码存入 sessionStorage，阅读页读取
    sessionStorage.setItem("draft_article", content);
    router.push("/reader/draft");
  };

  const handleSample = () => {
    setText(SAMPLE_TEXT);
  };

  const wordCount = text.trim() ? text.trim().split(/\s+/).length : 0;

  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "2rem 1.5rem",
        background: "var(--paper)",
      }}
    >
      {/* Logo / 标题区 */}
      <div
        className="animate-fade-up"
        style={{ textAlign: "center", marginBottom: "3rem" }}
      >
        <div
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: "0.5rem",
            marginBottom: "0.75rem",
          }}
        >
          <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
            <rect x="3" y="4" width="16" height="20" rx="2" fill="var(--accent)" opacity="0.15"/>
            <rect x="6" y="4" width="16" height="20" rx="2" stroke="var(--accent)" strokeWidth="1.5" fill="none"/>
            <line x1="10" y1="10" x2="18" y2="10" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="10" y1="14" x2="18" y2="14" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
            <line x1="10" y1="18" x2="15" y2="18" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round"/>
          </svg>
          <span
            style={{
              fontFamily: "var(--font-display)",
              fontSize: "1.5rem",
              fontWeight: 600,
              color: "var(--ink)",
              letterSpacing: "-0.01em",
            }}
          >
            LangReader
          </span>
        </div>
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.9rem",
            color: "var(--ink-3)",
            margin: 0,
            fontWeight: 300,
            letterSpacing: "0.02em",
          }}
        >
          粘贴英文文章 · 点击单词 · 积累词汇
        </p>
      </div>

      {/* 输入卡片 */}
      <div
        className="animate-fade-up"
        style={{
          width: "100%",
          maxWidth: "640px",
          animationDelay: "0.1s",
        }}
      >
        <div
          style={{
            background: "var(--card-bg)",
            border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
            borderRadius: "16px",
            overflow: "hidden",
            boxShadow: focused ? "0 0 0 4px var(--accent-glow), var(--shadow-md)" : "var(--shadow-sm)",
            transition: "border-color 0.2s ease, box-shadow 0.2s ease",
          }}
        >
          {/* 顶部标签栏 */}
          <div
            style={{
              padding: "0.75rem 1.25rem",
              borderBottom: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              gap: "0.5rem",
              background: "var(--paper-dark)",
            }}
          >
            {["#E8685A", "#F5BE4B", "#5CBF72"].map((c) => (
              <div key={c} style={{ width: 10, height: 10, borderRadius: "50%", background: c }} />
            ))}
            <span
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.75rem",
                color: "var(--ink-3)",
                marginLeft: "0.5rem",
                fontWeight: 400,
              }}
            >
              粘贴你的英文文章
            </span>
          </div>

          {/* 文本区 */}
          <textarea
            value={text}
            onChange={(e) => setText(e.target.value)}
            onFocus={() => setFocused(true)}
            onBlur={() => setFocused(false)}
            placeholder="将英文文章粘贴到这里，然后点击「开始阅读」……"
            rows={10}
            style={{
              width: "100%",
              padding: "1.25rem 1.5rem",
              border: "none",
              outline: "none",
              resize: "vertical",
              background: "transparent",
              fontFamily: "var(--font-serif)",
              fontSize: "1rem",
              lineHeight: 1.8,
              color: "var(--ink)",
              caretColor: "var(--accent)",
            }}
          />

          {/* 底部操作栏 */}
          <div
            style={{
              padding: "0.875rem 1.25rem",
              borderTop: "1px solid var(--border)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              background: "var(--paper-dark)",
            }}
          >
            {/* 字数 + 示例按钮 */}
            <div style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
              <span
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.78rem",
                  color: "var(--ink-3)",
                  fontWeight: 300,
                }}
              >
                {wordCount > 0 ? `${wordCount} 词` : "0 词"}
              </span>
              <button
                onClick={handleSample}
                style={{
                  fontFamily: "var(--font-ui)",
                  fontSize: "0.78rem",
                  color: "var(--accent)",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "0.2rem 0.5rem",
                  borderRadius: "4px",
                  transition: "background 0.15s",
                  fontWeight: 400,
                }}
                onMouseEnter={(e) => (e.currentTarget.style.background = "var(--accent-light)")}
                onMouseLeave={(e) => (e.currentTarget.style.background = "none")}
              >
                用示例文章
              </button>
            </div>

            {/* 提交按钮 */}
            <button
              onClick={handleSubmit}
              disabled={!text.trim()}
              style={{
                fontFamily: "var(--font-ui)",
                fontSize: "0.875rem",
                fontWeight: 500,
                padding: "0.5rem 1.25rem",
                borderRadius: "8px",
                border: "none",
                cursor: text.trim() ? "pointer" : "not-allowed",
                background: text.trim() ? "var(--accent)" : "var(--border)",
                color: text.trim() ? "#fff" : "var(--ink-3)",
                transition: "background 0.2s ease, transform 0.1s ease, opacity 0.2s",
                letterSpacing: "0.01em",
              }}
              onMouseEnter={(e) => {
                if (text.trim()) e.currentTarget.style.opacity = "0.88";
              }}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
              onMouseDown={(e) => {
                if (text.trim()) e.currentTarget.style.transform = "scale(0.97)";
              }}
              onMouseUp={(e) => (e.currentTarget.style.transform = "scale(1)")}
            >
              开始阅读 →
            </button>
          </div>
        </div>

        {/* 提示文字 */}
        <p
          style={{
            fontFamily: "var(--font-ui)",
            fontSize: "0.75rem",
            color: "var(--ink-3)",
            textAlign: "center",
            marginTop: "1rem",
            fontWeight: 300,
          }}
        >
          支持粘贴任意英文文章 · 数据仅存于本地
        </p>
      </div>
    </div>
  );
}
