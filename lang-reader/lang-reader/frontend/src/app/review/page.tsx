"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import ReviewCard from "@/components/ReviewCard";
import type { VocabularyWord, ReviewStatus, ReviewSummary } from "@/types";
import { getVocabulary, submitReview, getReviewSummary } from "@/lib/api";

// ── 判断按钮配置 ────────────────────────────────────────────
const ACTIONS: {
  status:  ReviewStatus;
  label:   string;
  sub:     string;
  border:  string;
  bg:      string;
  bgHover: string;
  color:   string;
  key:     string;
}[] = [
  {
    status: "new",   label: "不认识", sub: "重新学习", key: "1",
    border: "#B85B6A", bg: "transparent", bgHover: "#B85B6A12", color: "#B85B6A",
  },
  {
    status: "fuzzy", label: "模糊",   sub: "再练练",  key: "2",
    border: "#B87333", bg: "transparent", bgHover: "#B8733312", color: "#B87333",
  },
  {
    status: "known", label: "认识",   sub: "下次见",  key: "3",
    border: "#3D6B4F", bg: "var(--accent)", bgHover: "var(--accent)", color: "#ffffff",
  },
];

type Phase = "loading" | "empty" | "reviewing" | "done";

export default function ReviewPage() {
  const router = useRouter();

  const [phase, setPhase]         = useState<Phase>("loading");
  const [queue, setQueue]         = useState<VocabularyWord[]>([]);
  const [index, setIndex]         = useState(0);
  const [flipped, setFlipped]     = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError]         = useState<string | null>(null);
  const [summary, setSummary]     = useState<ReviewSummary | null>(null);

  // 本轮统计（不依赖后端）
  const [roundStats, setRoundStats] = useState({ known: 0, fuzzy: 0, unknown: 0 });

  // ── 初始化：加载生词，优先未复习 / 模糊 ────────────────────
  useEffect(() => {
    (async () => {
      try {
        const words = await getVocabulary();
        if (words.length === 0) { setPhase("empty"); return; }

        // 排序：new → fuzzy → known；同级按到期时间升序
        const sorted = [...words].sort((a, b) => {
          const order: Record<ReviewStatus, number> = { new: 0, fuzzy: 1, known: 2 };
          if (order[a.status] !== order[b.status]) return order[a.status] - order[b.status];
          // 未复习过的排最前
          if (!a.reviewed_at && b.reviewed_at) return -1;
          if (a.reviewed_at && !b.reviewed_at) return 1;
          return 0;
        });

        setQueue(sorted);
        setPhase("reviewing");
      } catch {
        setError("无法连接后端，请确认 FastAPI 已在 8000 端口运行");
        setPhase("empty");
      }
    })();
  }, []);

  // ── 键盘快捷键：1 / 2 / 3 和空格翻牌 ──────────────────────
  const handleMark = useCallback(async (status: ReviewStatus) => {
    if (submitting || phase !== "reviewing") return;
    const word = queue[index];
    if (!word) return;

    setSubmitting(true);
    setError(null);
    try {
      await submitReview(word.word, status);
    } catch {
      // 降级：API 失败仍继续复习，不阻断用户
      setError("保存失败（已跳过）");
      setTimeout(() => setError(null), 2500);
    }

    setRoundStats((s) => ({
      known:   status === "known" ? s.known + 1 : s.known,
      fuzzy:   status === "fuzzy" ? s.fuzzy + 1 : s.fuzzy,
      unknown: status === "new"   ? s.unknown + 1 : s.unknown,
    }));

    if (index + 1 >= queue.length) {
      // 复习完毕，拉一次汇总数据
      getReviewSummary().then(setSummary).catch(() => {});
      setPhase("done");
    } else {
      setIndex((i) => i + 1);
      setFlipped(false);
    }
    setSubmitting(false);
  }, [submitting, phase, queue, index]);

  useEffect(() => {
    if (phase !== "reviewing") return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === " " || e.key === "Enter") {
        if (!flipped) setFlipped(true);
      } else if (e.key === "1") handleMark("new");
      else if (e.key === "2") handleMark("fuzzy");
      else if (e.key === "3") handleMark("known");
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [phase, flipped, handleMark]);

  const currentWord = queue[index];
  const progress    = queue.length > 0 ? ((index) / queue.length) * 100 : 0;

  // ════════════════════════════════════════════════════════
  //  渲染各阶段
  // ════════════════════════════════════════════════════════

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
          复习
        </span>

        {/* 进度文字 */}
        {phase === "reviewing" && (
          <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.78rem", color: "var(--ink-3)", fontWeight: 300 }}>
            {index + 1} / {queue.length}
          </span>
        )}
        {phase !== "reviewing" && <div style={{ width: "60px" }} />}
      </header>

      {/* ── 进度条 ── */}
      {phase === "reviewing" && (
        <div style={{ height: "3px", background: "var(--border)", position: "relative" }}>
          <div style={{
            position: "absolute", left: 0, top: 0, height: "100%",
            width: `${progress}%`,
            background: "var(--accent)",
            transition: "width 0.4s var(--ease-out)",
            borderRadius: "0 2px 2px 0",
          }} />
        </div>
      )}

      <main style={{ maxWidth: "540px", margin: "0 auto", padding: "2.5rem 1.5rem 6rem" }}>

        {/* ── 加载中 ── */}
        {phase === "loading" && (
          <div style={{ textAlign: "center", padding: "5rem 0", fontFamily: "var(--font-ui)", fontSize: "0.88rem", color: "var(--ink-3)" }}>
            加载中…
          </div>
        )}

        {/* ── 错误提示（非阻断）── */}
        {error && (
          <div style={{
            fontFamily: "var(--font-ui)", fontSize: "0.82rem",
            color: "#B85B6A", background: "#B85B6A10",
            border: "1px solid #B85B6A30", borderRadius: "8px",
            padding: "0.6rem 1rem", marginBottom: "1.25rem",
            display: "flex", alignItems: "center", gap: "0.4rem",
          }}>
            ⚠ {error}
          </div>
        )}

        {/* ── 空状态 ── */}
        {phase === "empty" && (
          <div style={{ textAlign: "center", padding: "4rem 0" }}>
            <div style={{ fontSize: "2.5rem", marginBottom: "1rem" }}>📖</div>
            <p style={{ fontFamily: "var(--font-display)", fontSize: "1.2rem", color: "var(--ink-2)", margin: "0 0 0.5rem" }}>
              还没有单词可复习
            </p>
            <p style={{ fontFamily: "var(--font-ui)", fontSize: "0.85rem", color: "var(--ink-3)", margin: "0 0 1.75rem", fontWeight: 300 }}>
              先去阅读文章，把遇到的生词加入生词本吧
            </p>
            <button
              onClick={() => router.push("/")}
              style={{
                fontFamily: "var(--font-ui)", fontSize: "0.88rem", fontWeight: 500,
                padding: "0.6rem 1.5rem", borderRadius: "8px",
                background: "var(--accent)", color: "#fff",
                border: "none", cursor: "pointer",
              }}
            >
              去导入文章
            </button>
          </div>
        )}

        {/* ── 复习中 ── */}
        {phase === "reviewing" && currentWord && (
          <div className="animate-fade-up">
            {/* 翻转卡片 */}
            <ReviewCard
              word={currentWord}
              flipped={flipped}
              onFlip={() => setFlipped(true)}
            />

            {/* 判断按钮区（翻面后出现）*/}
            <div style={{
              marginTop: "1.5rem",
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: "0.65rem",
              opacity: flipped ? 1 : 0,
              transform: flipped ? "translateY(0)" : "translateY(8px)",
              transition: "opacity 0.3s ease, transform 0.3s ease",
              pointerEvents: flipped ? "auto" : "none",
            }}>
              {ACTIONS.map((a) => (
                <ActionButton
                  key={a.status}
                  {...a}
                  disabled={submitting}
                  onClick={() => handleMark(a.status)}
                />
              ))}
            </div>

            {/* 键盘提示 */}
            {flipped && (
              <p style={{
                fontFamily: "var(--font-ui)", fontSize: "0.7rem",
                color: "var(--ink-3)", textAlign: "center",
                marginTop: "1rem", fontWeight: 300,
                opacity: 0.8,
              }}>
                快捷键：<kbd style={kbdStyle}>1</kbd> 不认识 &nbsp;
                <kbd style={kbdStyle}>2</kbd> 模糊 &nbsp;
                <kbd style={kbdStyle}>3</kbd> 认识
              </p>
            )}
            {!flipped && (
              <p style={{
                fontFamily: "var(--font-ui)", fontSize: "0.7rem",
                color: "var(--ink-3)", textAlign: "center",
                marginTop: "1.25rem", fontWeight: 300, opacity: 0.8,
              }}>
                按 <kbd style={kbdStyle}>空格</kbd> 或点击卡片翻转
              </p>
            )}
          </div>
        )}

        {/* ── 本轮完成 ── */}
        {phase === "done" && (
          <DoneSummary
            roundStats={roundStats}
            total={queue.length}
            apiSummary={summary}
            onRestart={() => {
              setIndex(0);
              setFlipped(false);
              setRoundStats({ known: 0, fuzzy: 0, unknown: 0 });
              setPhase("reviewing");
            }}
            onVocabulary={() => router.push("/vocabulary")}
            onHome={() => router.push("/")}
          />
        )}

      </main>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
//  子组件
// ─────────────────────────────────────────────────────────

function ActionButton({
  label, sub, border, bg, bgHover, color, disabled, onClick, key: _k,
  status: _s,
}: {
  label: string; sub: string; border: string; bg: string;
  bgHover: string; color: string; disabled: boolean;
  onClick: () => void; key: string; status: ReviewStatus;
}) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontFamily: "var(--font-ui)",
        padding: "0.7rem 0.5rem 0.6rem",
        borderRadius: "10px",
        border: `1.5px solid ${border}`,
        background: hovered ? bgHover : bg,
        color,
        cursor: disabled ? "wait" : "pointer",
        opacity: disabled ? 0.6 : 1,
        transition: "background .15s, transform .1s, opacity .15s",
        transform: hovered && !disabled ? "translateY(-1px)" : "none",
        display: "flex", flexDirection: "column",
        alignItems: "center", gap: "0.2rem",
      }}
    >
      <span style={{ fontSize: "0.9rem", fontWeight: 500 }}>{label}</span>
      <span style={{ fontSize: "0.65rem", opacity: 0.7, fontWeight: 300 }}>{sub}</span>
    </button>
  );
}

function DoneSummary({
  roundStats, total, apiSummary, onRestart, onVocabulary, onHome,
}: {
  roundStats: { known: number; fuzzy: number; unknown: number };
  total: number;
  apiSummary: ReviewSummary | null;
  onRestart: () => void;
  onVocabulary: () => void;
  onHome: () => void;
}) {
  const pct = total > 0 ? Math.round((roundStats.known / total) * 100) : 0;

  return (
    <div className="animate-fade-up" style={{ textAlign: "center" }}>
      {/* 完成标题 */}
      <div style={{ fontSize: "2.5rem", marginBottom: "0.75rem" }}>
        {pct >= 80 ? "🎉" : pct >= 50 ? "💪" : "📚"}
      </div>
      <h2 style={{
        fontFamily: "var(--font-display)", fontSize: "1.5rem",
        fontWeight: 600, color: "var(--ink)", margin: "0 0 0.35rem",
      }}>
        本轮复习完成
      </h2>
      <p style={{
        fontFamily: "var(--font-ui)", fontSize: "0.85rem",
        color: "var(--ink-3)", margin: "0 0 2rem", fontWeight: 300,
      }}>
        共复习 {total} 个单词
      </p>

      {/* 本轮统计卡 */}
      <div style={{
        display: "grid", gridTemplateColumns: "1fr 1fr 1fr",
        gap: "0.75rem", marginBottom: "2rem",
      }}>
        {[
          { label: "认识", value: roundStats.known,   color: "#3D6B4F", bg: "#3D6B4F12" },
          { label: "模糊", value: roundStats.fuzzy,   color: "#B87333", bg: "#B8733312" },
          { label: "不认识", value: roundStats.unknown, color: "#B85B6A", bg: "#B85B6A12" },
        ].map((s) => (
          <div key={s.label} style={{
            background: s.bg, borderRadius: "12px",
            padding: "1rem 0.5rem",
          }}>
            <div style={{
              fontFamily: "var(--font-display)", fontSize: "1.8rem",
              fontWeight: 600, color: s.color, lineHeight: 1,
            }}>
              {s.value}
            </div>
            <div style={{
              fontFamily: "var(--font-ui)", fontSize: "0.72rem",
              color: s.color, marginTop: "0.25rem", fontWeight: 400, opacity: 0.8,
            }}>
              {s.label}
            </div>
          </div>
        ))}
      </div>

      {/* 累计数据（来自 API）*/}
      {apiSummary && (
        <div style={{
          background: "var(--card-bg)", border: "1px solid var(--border)",
          borderRadius: "12px", padding: "1rem 1.25rem",
          marginBottom: "1.75rem", textAlign: "left",
        }}>
          <p style={{
            fontFamily: "var(--font-ui)", fontSize: "0.72rem",
            color: "var(--ink-3)", margin: "0 0 0.6rem",
            letterSpacing: "0.05em", textTransform: "uppercase", fontWeight: 500,
          }}>
            今日总览
          </p>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.4rem 1.5rem" }}>
            {[
              { label: "今日复习", value: `${apiSummary.today_reviewed} 次` },
              { label: "生词本总量", value: `${apiSummary.total_words} 词` },
              { label: "今日掌握", value: `${apiSummary.today_known} 个` },
              { label: "待复习", value: `${apiSummary.due_count} 个` },
            ].map((r) => (
              <div key={r.label} style={{ display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--ink-3)", fontWeight: 300 }}>{r.label}</span>
                <span style={{ fontFamily: "var(--font-ui)", fontSize: "0.82rem", color: "var(--ink)", fontWeight: 500 }}>{r.value}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 操作按钮 */}
      <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
        <button
          onClick={onRestart}
          style={{
            fontFamily: "var(--font-ui)", fontSize: "0.9rem", fontWeight: 500,
            padding: "0.7rem", borderRadius: "10px",
            background: "var(--accent)", color: "#fff",
            border: "none", cursor: "pointer",
            transition: "opacity .15s",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          再复习一轮
        </button>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.65rem" }}>
          <button
            onClick={onVocabulary}
            style={{
              fontFamily: "var(--font-ui)", fontSize: "0.85rem",
              padding: "0.65rem", borderRadius: "10px",
              background: "transparent", color: "var(--ink-2)",
              border: "1.5px solid var(--border)", cursor: "pointer",
            }}
          >
            查看生词本
          </button>
          <button
            onClick={onHome}
            style={{
              fontFamily: "var(--font-ui)", fontSize: "0.85rem",
              padding: "0.65rem", borderRadius: "10px",
              background: "transparent", color: "var(--ink-2)",
              border: "1.5px solid var(--border)", cursor: "pointer",
            }}
          >
            去读新文章
          </button>
        </div>
      </div>
    </div>
  );
}

const kbdStyle: React.CSSProperties = {
  fontFamily: "var(--font-ui)", fontSize: "0.65rem",
  background: "var(--paper-dark)", border: "1px solid var(--border)",
  borderRadius: "3px", padding: "0.1rem 0.3rem",
  display: "inline-block", lineHeight: 1.5,
};
