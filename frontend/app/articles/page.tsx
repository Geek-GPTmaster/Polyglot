"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Upload, BookOpen, FileText, Clock } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";
import { fetchArticles } from "@/lib/api";
import { useToast } from "@/components/Toast";
import ImportModal from "@/components/ImportModal";
import CameraImportModal from "@/components/CameraImportModal";
import type { ArticleImportResponse, ArticleListItem } from "@/lib/types";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(undefined, {
    year: "numeric", month: "short", day: "numeric",
  });
}

const FORMAT_LABEL: Record<string, string> = {
  pdf: "PDF", txt: "TXT", md: "MD",
  docx: "DOCX", epub: "EPUB", paste: "Text",
};

// ---------------------------------------------------------------------------
// Article card
// ---------------------------------------------------------------------------

function ArticleCard({ article }: { article: ArticleListItem }) {
  return (
    <Link
      href={`/articles/${article.id}`}
      style={{
        display:        "block",
        background:     "var(--color-paper-dark)",
        border:         "1px solid var(--color-paper-darker)",
        borderRadius:   "var(--radius-lg)",
        boxShadow:      "var(--shadow-card)",
        padding:        "var(--space-6)",
        textDecoration: "none",
        color:          "inherit",
        transition:     "box-shadow 150ms ease, transform 150ms ease",
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-md)";
        (e.currentTarget as HTMLElement).style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.boxShadow = "var(--shadow-card)";
        (e.currentTarget as HTMLElement).style.transform = "";
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "var(--space-3)", marginBottom: "var(--space-3)" }}>
        <h2
          style={{
            fontFamily:   "var(--font-serif)",
            fontSize:     "var(--text-md)",
            fontWeight:   "var(--font-semibold)",
            color:        "var(--color-ink)",
            margin:       0,
            lineHeight:   "var(--leading-tight)",
            flex:         1,
          }}
        >
          {article.title}
        </h2>
        <span
          style={{
            fontFamily:   "var(--font-sans)",
            fontSize:     "var(--text-xs)",
            fontWeight:   "var(--font-semibold)",
            color:        "var(--color-ink-light)",
            background:   "var(--color-paper-darker)",
            borderRadius: "var(--radius-sm)",
            padding:      "2px 6px",
            flexShrink:   0,
          }}
        >
          {FORMAT_LABEL[article.source_format] ?? article.source_format.toUpperCase()}
        </span>
      </div>

      <div style={{ display: "flex", gap: "var(--space-4)", flexWrap: "wrap" }}>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <FileText size={12} />
          {article.word_count.toLocaleString()} words
        </span>
        <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
          <BookOpen size={12} />
          Added {formatDate(article.created_at)}
        </span>
        {article.last_read_at && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "flex", alignItems: "center", gap: "var(--space-1)" }}>
            <Clock size={12} />
            Read {formatDate(article.last_read_at)}
          </span>
        )}
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Articles list page
// ---------------------------------------------------------------------------

export default function ArticlesPage() {
  const { activeLang } = useLanguage();
  const { toast }      = useToast();

  const [articles, setArticles]       = useState<ArticleListItem[]>([]);
  const [loading, setLoading]         = useState(true);
  const [importOpen, setImportOpen]   = useState(false);
  const [cameraOpen, setCameraOpen]   = useState(false);

  const loadArticles = useCallback(() => {
    setLoading(true);
    fetchArticles(activeLang)
      .then(setArticles)
      .catch(() => toast("Failed to load articles.", "error"))
      .finally(() => setLoading(false));
  }, [activeLang, toast]);

  useEffect(() => { loadArticles(); }, [loadArticles]);

  function handleImportSuccess(article: ArticleImportResponse) {
    setImportOpen(false);
    toast(`"${article.title}" imported successfully.`);
    loadArticles();
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-8)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-ink)", margin: 0 }}>
            Articles
          </h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", marginTop: "var(--space-1)" }}>
            {activeLang.toUpperCase()} — {articles.length} article{articles.length !== 1 ? "s" : ""}
          </p>
        </div>
        <button className="btn-primary" onClick={() => setImportOpen(true)}>
          <Upload size={16} />
          Import Article
        </button>
      </div>

      {/* Loading */}
      {loading && (
        <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-ink-faint)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)" }}>
          Loading…
        </div>
      )}

      {/* Article grid */}
      {!loading && articles.length > 0 && (
        <div
          style={{
            display:             "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(300px, 1fr))",
            gap:                 "var(--space-4)",
          }}
        >
          {articles.map((a) => <ArticleCard key={a.id} article={a} />)}
        </div>
      )}

      {/* Empty state */}
      {!loading && articles.length === 0 && (
        <div style={{ textAlign: "center", padding: "var(--space-16) var(--space-8)" }}>
          <BookOpen size={48} style={{ color: "var(--color-ink-faint)", margin: "0 auto var(--space-4)", display: "block" }} />
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-lg)", color: "var(--color-ink)", marginBottom: "var(--space-2)" }}>
            No articles yet
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", marginBottom: "var(--space-6)" }}>
            Import a PDF, .docx, .epub, or paste plain text to get started.
          </p>
          <button className="btn-primary" onClick={() => setImportOpen(true)}>
            <Upload size={16} />
            Import Article
          </button>
        </div>
      )}

      <ImportModal
        open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={handleImportSuccess}
        onCameraRequest={() => { setImportOpen(false); setCameraOpen(true); }}
      />
      <CameraImportModal
        open={cameraOpen}
        onClose={() => setCameraOpen(false)}
        onSuccess={handleImportSuccess}
        language={activeLang}
      />
    </div>
  );
}
