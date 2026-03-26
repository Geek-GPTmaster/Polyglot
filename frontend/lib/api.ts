import type {
  Article,
  ArticleImportResponse,
  ArticleListItem,
  DashboardData,
  Language,
  ReviewDueResponse,
  ReviewResultResponse,
  Save,
  Tag,
  VocabularyEntry,
  WordDefinition,
} from "./types";

const API_BASE =
  process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:8000";

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    headers: { "Content-Type": "application/json", ...options?.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<T>;
}

// ---------------------------------------------------------------------------
// Languages
// ---------------------------------------------------------------------------

export async function fetchLanguages(all = false): Promise<Language[]> {
  return request<Language[]>(`/api/languages${all ? "?all=true" : ""}`);
}

// ---------------------------------------------------------------------------
// Articles
// ---------------------------------------------------------------------------

export async function fetchArticles(language: string): Promise<ArticleListItem[]> {
  return request<ArticleListItem[]>(`/api/articles?language=${encodeURIComponent(language)}`);
}

export async function fetchArticle(id: number): Promise<Article> {
  return request<Article>(`/api/articles/${id}`);
}

export async function importArticle(formData: FormData): Promise<ArticleImportResponse> {
  const res = await fetch(`${API_BASE}/api/articles/import`, {
    method: "POST",
    body: formData,
    // No Content-Type header — browser sets multipart/form-data boundary
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body?.detail ?? `HTTP ${res.status}`);
  }
  return res.json() as Promise<ArticleImportResponse>;
}

export async function patchScrollPosition(
  id: number,
  scrollPosition: number
): Promise<void> {
  await request(`/api/articles/${id}/scroll`, {
    method: "PATCH",
    body: JSON.stringify({ scroll_position: scrollPosition }),
  });
}

// ---------------------------------------------------------------------------
// Word Definitions
// ---------------------------------------------------------------------------

export async function fetchDefinition(
  word: string,
  language: string
): Promise<WordDefinition | null> {
  try {
    return await request<WordDefinition>(
      `/api/definitions/${encodeURIComponent(word)}?language=${encodeURIComponent(language)}`
    );
  } catch (err) {
    if (err instanceof Error && err.message.includes("404")) return null;
    throw err;
  }
}

// ---------------------------------------------------------------------------
// Vocabulary
// ---------------------------------------------------------------------------

export async function fetchVocabulary(
  language: string,
  opts?: { tagId?: number; search?: string }
): Promise<VocabularyEntry[]> {
  const params = new URLSearchParams({ language });
  if (opts?.tagId != null) params.set("tag_id", String(opts.tagId));
  if (opts?.search)        params.set("search", opts.search);
  return request<VocabularyEntry[]>(`/api/vocabulary?${params}`);
}

export async function createVocabularyEntry(data: {
  word: string;
  language_code: string;
  source_article_id?: number;
}): Promise<VocabularyEntry> {
  return request<VocabularyEntry>("/api/vocabulary", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function updateVocabularyEntry(
  id: number,
  data: { notes?: string | null; tag_id?: number | null }
): Promise<VocabularyEntry> {
  return request<VocabularyEntry>(`/api/vocabulary/${id}`, {
    method: "PATCH",
    body: JSON.stringify(data),
  });
}

export async function deleteVocabularyEntry(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/vocabulary/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) {
    throw new Error(`HTTP ${res.status}`);
  }
}

// ---------------------------------------------------------------------------
// Review
// ---------------------------------------------------------------------------

export async function fetchReviewDue(language: string): Promise<ReviewDueResponse> {
  return request<ReviewDueResponse>(
    `/api/review/due?language=${encodeURIComponent(language)}`
  );
}

export async function submitReviewResult(
  vocabularyId: number,
  result: "known" | "unknown"
): Promise<ReviewResultResponse> {
  return request<ReviewResultResponse>(`/api/review/${vocabularyId}/result`, {
    method: "POST",
    body: JSON.stringify({ result }),
  });
}

// ---------------------------------------------------------------------------
// Saves
// ---------------------------------------------------------------------------

export async function fetchSaves(type?: "annotation" | "quote"): Promise<Save[]> {
  const params = type ? `?type=${type}` : "";
  return request<Save[]>(`/api/saves${params}`);
}

export async function createSave(data: {
  article_id: number;
  type: "annotation" | "quote";
  saved_text: string;
  note?: string;
  char_start?: number;
  char_end?: number;
}): Promise<Save> {
  return request<Save>("/api/saves", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

export async function deleteSave(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/saves/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

// ---------------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------------

export async function fetchTags(): Promise<Tag[]> {
  return request<Tag[]>("/api/tags");
}

export async function createTag(name: string): Promise<Tag> {
  return request<Tag>("/api/tags", {
    method: "POST",
    body: JSON.stringify({ name }),
  });
}

export async function updateTag(id: number, name: string): Promise<Tag> {
  return request<Tag>(`/api/tags/${id}`, {
    method: "PATCH",
    body: JSON.stringify({ name }),
  });
}

export async function deleteTag(id: number): Promise<void> {
  const res = await fetch(`${API_BASE}/api/tags/${id}`, { method: "DELETE" });
  if (!res.ok && res.status !== 204) throw new Error(`HTTP ${res.status}`);
}

// ---------------------------------------------------------------------------
// Settings
// ---------------------------------------------------------------------------

export async function fetchSettings(): Promise<Record<string, string>> {
  return request<Record<string, string>>("/api/settings");
}

export async function updateSettings(
  updates: Record<string, string>
): Promise<Record<string, string>> {
  return request<Record<string, string>>("/api/settings", {
    method: "PATCH",
    body: JSON.stringify(updates),
  });
}

// ---------------------------------------------------------------------------
// Dashboard
// ---------------------------------------------------------------------------

export async function fetchDashboard(language: string): Promise<DashboardData> {
  return request<DashboardData>(
    `/api/dashboard?language=${encodeURIComponent(language)}`
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

export function buildExportURL(language?: string): string {
  const params = language ? `?language=${encodeURIComponent(language)}` : "";
  return `${API_BASE}/api/export/vocabulary${params}`;
}
