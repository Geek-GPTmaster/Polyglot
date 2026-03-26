// ============================================================
// Core domain types — mirror the backend Pydantic schemas
// ============================================================

export interface Language {
  code: string;
  name: string;
  native_name: string;
  is_active: boolean;
}

export interface ArticleListItem {
  id: number;
  title: string;
  language_code: string;
  word_count: number;
  source_format: string;
  created_at: string;
  last_read_at: string | null;
}

export interface Article extends ArticleListItem {
  content: string;
  scroll_position: number;
}

export interface ArticleImportResponse {
  id: number;
  title: string;
  language_code: string;
  word_count: number;
}

export interface Tag {
  id: number;
  name: string;
  created_at: string;
}

export interface VocabularyEntry {
  id: number;
  word: string;
  language_code: string;
  definition: string | null;
  phonetics: string | null;
  part_of_speech: string | null;
  example: string | null;
  notes: string | null;
  tag: Tag | null;
  interval_days: number;
  repetitions: number;
  next_review_at: string;
  created_at: string;
}

export interface WordDefinition {
  word: string;
  language_code: string;
  phonetics: string | null;
  part_of_speech: string | null;
  definition: string | null;
  example: string | null;
  synonyms: string[];
}

export interface ReviewCard {
  id: number;
  word: string;
  language_code: string;
  phonetics: string | null;
  part_of_speech: string | null;
  definition: string | null;
  example: string | null;
  repetitions: number;
  interval_days: number;
}

export interface ReviewDueResponse {
  count: number;
  daily_limit: number;
  language_code: string;
  cards: ReviewCard[];
}

export interface ReviewResultResponse {
  id: number;
  next_review_at: string;
  interval_days: number;
  repetitions: number;
}

export interface Save {
  id: number;
  article_id: number;
  article_title: string;
  type: "annotation" | "quote";
  saved_text: string;
  note: string | null;
  created_at: string;
}

export interface DashboardData {
  language_code: string;
  total_articles: number;
  total_vocabulary: number;
  due_today: number;
  reviewed_today: number;
  recent_articles: {
    id: number;
    title: string;
    language_code: string;
    last_read_at: string | null;
  }[];
}

export type FontSize = "small" | "medium" | "large";
