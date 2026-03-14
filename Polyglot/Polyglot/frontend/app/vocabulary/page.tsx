"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import type { VocabularyWord, ReviewStatus } from "@/types";
import { getVocabulary, removeFromVocabulary } from "@/lib/api";

const TABS: { label: string; value: ReviewStatus | "all" }[] = [
  { label: "全部",   value: "all"   },
  { label: "不认识", value: "new"   },
  { label: "模糊",   value: "fuzzy" },
  { label: "认识",   value: "known" },
];

const STATUS_LABEL: Record<string, { text: string; color: string; bg: string }> = {
  new:   { text: "不认识", color: "#B85B6A", bg: "#B85B6A18" },
  fuzzy: { text: "模糊",   color: "#B87333", bg: "#B8733318" },
  known: { text: "认识",   color: "#3D6B4F", bg: "#3D6B4F18" },
};

export default function VocabularyPage() {
  const router = useRouter();
  const [words, setWords]         = useState<VocabularyWord[]>([]);
  const [activeTab, setActiveTab] = useState<ReviewStatus | "all">("all");
  const [loading, setLoading]     = useState(true);
  const [error, setError]         = useState<string | null>(null);
  const [expanded, setExpanded]   = useState<string | null>(null);  // 展开的单词
  const [removing, setRemoving]   = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const status = activeTab === "all" ? undefined : activeTab;
      const data = await getVocabulary(status);
      setWords(data);
    } catch {
      setError("无法连接后端，请确认 FastAPI 服务已启动（端口 8000）");
    } finally {
      setLoading(false);
    }
  }, [activeTab]);

  useEffect(() => { load(); }, [load]);

  const handleRemove = async (word: string) => {
    setRemoving(word);
    try {
      await removeFromVocabulary(word);
      setWords((prev) => prev.filter((w) => w.word !== word));
      if (expanded === word) setExpanded(null);
    } catch (e) {
      alert(`删除失败：${e}`);
    } finally {
      setRemoving(null);
    }
  };

  return (
    <div style={{ background: "var(--paper)", minHeight: "100vh" }}>
      {/* ── 顶栏 ── */}
      <header style={{
        position: "sticky", top: 0, zIndex: 10,
        background: "rgba(247,243,236,0.92)", backdropFilter: "blur(12px)",
        borderBottom: "1px solid var(--border)",
        padding: "0 1.5rem", height: "52px",
        display: "flex", alignItems: "center", justifyContent: "space-between",
      }}>
        <button
          onClick={() => router.back()}
          style={{
            display: "flex", alignItems: "center", gap: "0.4rem",
            fontFamily: "var(--font-ui)", fontSize: "0.82rem",
            color: "var(--ink-3)", background: "none", border: "none",
            cursor: "pointer", padding: "0.3rem 0.5rem", borderRadius: "6px",
          }}
          onMouseEnter={(e) => { e.currentTarget.style.color = "var(--ink)"; e.currentTarget.style.background = "var(--paper-dark)"; }}
          onMouseLeave={(e) => { e.currentTarget.style.color = "var(--ink-3)"; e.currentTarget.style.background = "none"; }}
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M9 2L4 7L9 12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
          返回
        </button>

        <span style={{ fontFamily: "var(--font-display)", fontSize: "1rem", fontWeight: 500, color: "var(--ink-2)" }}>
          生词本
        </span>

        <button
          onClick={() => router.push("/review")}
          style={{
            fontFamily: "var(--font-ui)", fontSize: "0.82rem",
            color: words.length > 0 ? "var(--accent)" : "var(--ink-3)",
            background: words.length > 0 ? "var(--accent-light)" : "none",
            border: "none", cursor: words.length > 0 ? "pointer" : "default",
            padding: "0.3rem 0.65rem", borderRadius: "6px",
          }}
        >
          开始复习 →
        </button>
      </header>

      <main style={{ maxWidth: "var(--reader-width)", margin: "0 auto", padding: "2rem 1.5rem 6rem" }}>
        {/* ── Tab 筛选 ── */}
        <div style={{ display: "flex", gap: "0.5rem", marginBottom: "1.75rem" }}>
          {TABS.map((tab) => {
            const isActive = tab.value === activeTab;
            return (
              <button
                key={tab.value}
                onClick={() => setActiveTab(tab.value)}
                style={{
                  fontFamily: "var(--font-ui)", fontSize: "0.82rem", fontWeight: isActive ? 500 : 400,
                  padding: "0.35rem 0.9rem", borderRadius: "20px",
                  border: `1.5px solid ${isActive ? "var(--accent)" : "var(--border)"}`,
                  background: isActive ? "var(--accent)" : "transparent",
                  color: isActive ? "#fff" : "var(--ink-3)",
                  cursor: "pointer", transition: "all .15s",
                }}
              >
                {tab.label}
              </button>
            );
          })}
        </div>

        {/* ── 错误提示 ── */}
        {error && (
          <div style={{
            fontFamily: "var(--font-ui)", fontSize: "0.85rem",
            color: "#B85B6A", background: "#B85B6A10",
            border: "1px solid #B85B6A30", borderRadius: "10px",
            padding: "0.85rem 1.1rem", marginBottom: "1.5rem",
            display: "flex", alignItems: "center", gap: "0.5rem",
          }}>
            <span>⚠</span> {error}
            <button
              onClick={load}
              style={{ marginLeft: "auto", color: "#B85B6A", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-ui)", fontSize: "0.82rem", textDecoration: "underline" }}
            >
              重试
            </button>
          </div>
        )}

        {/* ── 加载中 ── */}
        {loading && (
          <div style={{ textAlign: "center", padding: "3rem 0", color: "var(--ink-3)", fontFamily: "var(--font-ui)", fontSize: "0.88rem" }}>
            加载中…
          </div>
        )}

        {/* ── 空状态 ── */}
        {!loading && !error && words.length === 0 && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--ink-2)", margin: "0 0 0.5rem" }}>
              生词本还是空的
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--ink-3)", margin: "0 0 1.5rem", fontWeight: 300 }}>
              去阅读文章，点击单词加入吧
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                fontFamily: "var(--font-ui)", fontSize: "0.88rem", fontWeight: 500,
                padding: "0.55rem 1.4rem", borderRadius: "8px",
                background: "var(--accent)", color: "#fff", border: "none", cursor: "pointer",
              }}
            >
              去导入文章
            </button>
          </div>
        )}

        {/* ── 单词列表 ── */}
        {!loading && words.length > 0 && (
          <>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--ink-3)", marginBottom: "1rem", fontWeight: 300 }}>
              共 {words.length} 个单词
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
              {words.map((w) => {
                const isExpanded = expanded === w.word;
                const st = STATUS_LABEL[w.status] ?? STATUS_LABEL.new;
                const isRemoving = removing === w.word;

                return (
                  <div
                    key={w.word}
                    style={{
                      background: "var(--card-bg)",
                      border: "1px solid var(--border)",
                      borderRadius: "12px",
                      overflow: "hidden",
                      boxShadow: "var(--shadow-sm)",
                      transition: "box-shadow .15s",
                    }}
                    onMouseEnter={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-md)")}
                    onMouseLeave={(e) => (e.currentTarget.style.boxShadow = "var(--shadow-sm)")}
                  >
                    {/* 折叠行 */}
                    <div
                      onClick={() => setExpanded(isExpanded ? null : w.word)}
                      style={{
                        padding: "0.85rem 1.1rem",
                        display: "flex", alignItems: "center", gap: "0.75rem",
                        cursor: "pointer",
                      }}
                    >
                      {/* 单词 + 音标 */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: "var(--font-display)", fontSize: "1.1rem", fontWeight: 500, color: "var(--ink)" }}>
                          {w.word}
                        </span>
                        {w.phonetic && (
                          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.75rem", color: "var(--ink-3)", marginLeft: "0.5rem", fontWeight: 300 }}>
                            {w.phonetic}
                          </span>
                        )}
                        {/* 第一条释义预览 */}
                        {!isExpanded && w.definitions[0] && (
                          <p style={{
                            fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--ink-2)",
                            margin: "0.15rem 0 0", overflow: "hidden", textOverflow: "ellipsis",
                            whiteSpace: "nowrap", fontWeight: 300,
                          }}>
                            {w.definitions[0].meaning}
                          </p>
                        )}
                      </div>

                      {/* 状态标签 */}
                      <span style={{
                        fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 500,
                        padding: "0.15rem 0.5rem", borderRadius: "4px",
                        background: st.bg, color: st.color,
                        whiteSpace: "nowrap", flexShrink: 0,
                      }}>
                        {st.text}
                      </span>

                      {/* 展开箭头 */}
                      <svg
                        width="14" height="14" viewBox="0 0 14 14" fill="none"
                        style={{ flexShrink: 0, color: "var(--ink-3)", transition: "transform .2s", transform: isExpanded ? "rotate(180deg)" : "none" }}
                      >
                        <path d="M3 5L7 9L11 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                      </svg>
                    </div>

                    {/* 展开内容 */}
                    {isExpanded && (
                      <div style={{ padding: "0 1.1rem 1rem", borderTop: "1px solid var(--border)" }}>
                        {w.definitions.map((def, i) => (
                          <div key={i} style={{ marginTop: "0.75rem" }}>
                            <span style={{
                              fontFamily: "var(--font-ui)", fontSize: "0.68rem", fontWeight: 500,
                              letterSpacing: "0.06em", textTransform: "uppercase",
                              padding: "0.12rem 0.45rem", borderRadius: "4px",
                              background: "#88888818", color: "var(--ink-3)",
                            }}>
                              {def.pos}
                            </span>
                            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.92rem", color: "var(--ink)", margin: "0.35rem 0 0.25rem", lineHeight: 1.5 }}>
                              {def.meaning}
                            </p>
                            {def.example && (
                              <p style={{
                                fontFamily: "var(--font-serif)", fontSize: "0.85rem",
                                fontStyle: "italic", color: "var(--ink-3)",
                                margin: 0, lineHeight: 1.65,
                                paddingLeft: "0.65rem", borderLeft: "2px solid var(--border)",
                              }}>
                                {def.example}
                              </p>
                            )}
                          </div>
                        ))}

                        {/* 操作：删除 */}
                        <div style={{ marginTop: "1rem", display: "flex", gap: "0.5rem", justifyContent: "flex-end" }}>
                          <button
                            onClick={(e) => { e.stopPropagation(); handleRemove(w.word); }}
                            disabled={isRemoving}
                            style={{
                              fontFamily: "var(--font-ui)", fontSize: "0.78rem",
                              padding: "0.3rem 0.8rem", borderRadius: "6px",
                              border: "1px solid #B85B6A40", color: "#B85B6A",
                              background: "transparent", cursor: "pointer",
                              opacity: isRemoving ? 0.5 : 1, transition: "background .15s",
                            }}
                            onMouseEnter={(e) => (e.currentTarget.style.background = "#B85B6A12")}
                            onMouseLeave={(e) => (e.currentTarget.style.background = "transparent")}
                          >
                            {isRemoving ? "删除中…" : "从生词本移除"}
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
