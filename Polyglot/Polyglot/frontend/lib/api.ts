/**
 * lib/api.ts — 后端请求封装
 * 路由对应新结构：
 *   /api/vocabulary  — 生词本 CRUD
 *   /api/review      — 复习接口
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

// ── 生词本 ───────────────────────────────────────────────────

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

// ── 复习（新路由 /api/review）───────────────────────────────

export async function submitReview(word: string, result: ReviewStatus): Promise<VocabularyWord> {
  return request<VocabularyWord>(
    `${BASE}/review/${encodeURIComponent(word)}`,
    { method: "POST", body: JSON.stringify({ status: result }) },
  );
}

export async function getReviewSummary(): Promise<ReviewSummary> {
  return request<ReviewSummary>(`${BASE}/review/stats/summary`);
}

export async function getWordLogs(word: string): Promise<ReviewLog[]> {
  return request<ReviewLog[]>(`${BASE}/review/${encodeURIComponent(word)}/logs`);
}
