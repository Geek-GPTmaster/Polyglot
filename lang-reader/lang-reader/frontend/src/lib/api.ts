/**
 * lib/api.ts — 后端请求封装
 */
import type {
  VocabularyWord, ReviewStatus, Definition,
  ReviewLog, ReviewSummary,
} from "@/types";

const BASE = "/api";

async function request<T>(url: string, options?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: res.statusText }));
    throw new Error(err.detail ?? `HTTP ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

// ── 生词本 CRUD ──────────────────────────────────────────────

export async function getVocabulary(status?: ReviewStatus): Promise<VocabularyWord[]> {
  const url = status ? `${BASE}/vocabulary?status=${status}` : `${BASE}/vocabulary`;
  return request<VocabularyWord[]>(url);
}

export async function addToVocabulary(
  word: string,
  phonetic: string | null,
  definitions: Definition[],
  articleId?: number,
): Promise<VocabularyWord> {
  return request<VocabularyWord>(`${BASE}/vocabulary`, {
    method: "POST",
    body: JSON.stringify({ word, phonetic, definitions, article_id: articleId ?? null }),
  });
}

export async function removeFromVocabulary(word: string): Promise<void> {
  await request<void>(`${BASE}/vocabulary/${encodeURIComponent(word)}`, { method: "DELETE" });
}

export async function updateWordStatus(word: string, status: ReviewStatus): Promise<VocabularyWord> {
  return request<VocabularyWord>(
    `${BASE}/vocabulary/${encodeURIComponent(word)}/status`,
    { method: "PATCH", body: JSON.stringify({ status }) },
  );
}

// ── 复习 ────────────────────────────────────────────────────

/** 提交复习结果（写日志 + 更新 SRS 字段） */
export async function submitReview(word: string, result: ReviewStatus): Promise<VocabularyWord> {
  return request<VocabularyWord>(
    `${BASE}/vocabulary/${encodeURIComponent(word)}/review`,
    { method: "POST", body: JSON.stringify({ status: result }) },
  );
}

/** 获取今日复习概况 */
export async function getReviewSummary(): Promise<ReviewSummary> {
  return request<ReviewSummary>(`${BASE}/vocabulary/stats/summary`);
}

/** 获取单词复习历史 */
export async function getWordLogs(word: string): Promise<ReviewLog[]> {
  return request<ReviewLog[]>(`${BASE}/vocabulary/${encodeURIComponent(word)}/logs`);
}
