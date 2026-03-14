export interface Definition {
  pos:     string;
  meaning: string;
  example: string;
}

export interface WordInfo {
  word:          string;
  phonetic:      string | null;
  definitions:   Definition[];
  in_vocabulary: boolean;
}

export type ReviewStatus = "new" | "fuzzy" | "known";

export interface VocabularyWord {
  id:              number;
  word:            string;
  phonetic:        string | null;
  definitions:     Definition[];
  status:          ReviewStatus;
  // SRS 字段（后续间隔复习算法使用）
  ease_factor:     number;
  interval_days:   number;
  repetitions:     number;
  next_review_at:  string | null;
  added_at:        string;
  reviewed_at:     string | null;
}

export interface ReviewLog {
  id:                   number;
  word:                 string;
  result:               ReviewStatus;
  reviewed_at:          string;
  ease_factor_before:   number | null;
  ease_factor_after:    number | null;
  interval_days_before: number | null;
  interval_days_after:  number | null;
}

export interface ReviewSummary {
  today_reviewed: number;
  today_known:    number;
  today_fuzzy:    number;
  today_new:      number;
  total_words:    number;
  due_count:      number;
}

export interface Article {
  id:         number;
  title:      string;
  content:    string;
  word_count: number | null;
  created_at: string;
}

export interface ArticleListItem {
  id:         number;
  title:      string;
  word_count: number | null;
  created_at: string;
}
