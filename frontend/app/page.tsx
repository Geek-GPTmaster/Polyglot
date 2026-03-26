"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  BookOpen,
  BookMarked,
  RotateCcw,
  Clock,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";
import { fetchDashboard } from "@/lib/api";
import type { DashboardData } from "@/lib/types";

// ---------------------------------------------------------------------------
// Stat card
// ---------------------------------------------------------------------------

function StatCard({
  label,
  value,
  icon,
  accent = false,
}: {
  label: string;
  value: number | string;
  icon: React.ReactNode;
  accent?: boolean;
}) {
  return (
    <div
      style={{
        background:     "var(--color-paper-dark)",
        border:         "1px solid var(--color-paper-darker)",
        borderRadius:   "var(--radius-lg)",
        boxShadow:      "var(--shadow-card)",
        padding:        "var(--space-6)",
        display:        "flex",
        alignItems:     "center",
        gap:            "var(--space-4)",
      }}
    >
      <div
        style={{
          width:          "44px",
          height:         "44px",
          borderRadius:   "var(--radius-md)",
          background:     accent ? "var(--color-accent-faint)" : "var(--color-paper-darker)",
          color:          accent ? "var(--color-accent)"       : "var(--color-ink-light)",
          display:        "flex",
          alignItems:     "center",
          justifyContent: "center",
          flexShrink:     0,
        }}
      >
        {icon}
      </div>
      <div>
        <div
          style={{
            fontFamily: "var(--font-serif)",
            fontSize:   "var(--text-3xl)",
            fontWeight: "var(--font-bold)",
            color:      accent ? "var(--color-accent)" : "var(--color-ink)",
            lineHeight: 1,
          }}
        >
          {value}
        </div>
        <div
          style={{
            fontFamily: "var(--font-sans)",
            fontSize:   "var(--text-sm)",
            color:      "var(--color-ink-light)",
            marginTop:  "var(--space-1)",
          }}
        >
          {label}
        </div>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Recent article row
// ---------------------------------------------------------------------------

function RecentArticleRow({
  id,
  title,
  lastReadAt,
}: {
  id: number;
  title: string;
  lastReadAt: string | null;
}) {
  const date = lastReadAt
    ? new Date(lastReadAt).toLocaleDateString(undefined, {
        month: "short",
        day:   "numeric",
      })
    : null;

  return (
    <Link
      href={`/articles/${id}`}
      style={{
        display:        "flex",
        alignItems:     "center",
        justifyContent: "space-between",
        padding:        "var(--space-3) 0",
        borderBottom:   "1px solid var(--color-paper-darker)",
        textDecoration: "none",
        color:          "inherit",
        gap:            "var(--space-4)",
      }}
    >
      <span
        style={{
          fontFamily:   "var(--font-serif)",
          fontSize:     "var(--text-base)",
          color:        "var(--color-ink)",
          overflow:     "hidden",
          textOverflow: "ellipsis",
          whiteSpace:   "nowrap",
          flex:         1,
        }}
      >
        {title}
      </span>
      <div
        style={{
          display:    "flex",
          alignItems: "center",
          gap:        "var(--space-2)",
          flexShrink: 0,
          color:      "var(--color-ink-light)",
        }}
      >
        {date && (
          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)" }}>
            {date}
          </span>
        )}
        <ChevronRight size={14} />
      </div>
    </Link>
  );
}

// ---------------------------------------------------------------------------
// Dashboard page
// ---------------------------------------------------------------------------

export default function DashboardPage() {
  const { activeLang } = useLanguage();
  const [data, setData]       = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    fetchDashboard(activeLang)
      .then(setData)
      .catch((err: Error) => setError(err.message))
      .finally(() => setLoading(false));
  }, [activeLang]);

  return (
    <div className="page-container">
      {/* Heading */}
      <div style={{ marginBottom: "var(--space-8)" }}>
        <h1
          style={{
            fontFamily: "var(--font-serif)",
            fontSize:   "var(--text-xl)",
            fontWeight: "var(--font-semibold)",
            color:      "var(--color-ink)",
            margin:     0,
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontFamily: "var(--font-sans)",
            fontSize:   "var(--text-sm)",
            color:      "var(--color-ink-light)",
            marginTop:  "var(--space-1)",
          }}
        >
          {activeLang.toUpperCase()} — your reading progress at a glance
        </p>
      </div>

      {/* Offline banner */}
      {error && (
        <div
          style={{
            background:   "var(--color-error-light)",
            color:        "var(--color-error)",
            borderRadius: "var(--radius-md)",
            padding:      "var(--space-4)",
            fontSize:     "var(--text-sm)",
            fontFamily:   "var(--font-sans)",
            marginBottom: "var(--space-6)",
          }}
        >
          Backend offline — some data may be unavailable.
        </div>
      )}

      {/* Stats grid */}
      <div
        style={{
          display:             "grid",
          gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))",
          gap:                 "var(--space-4)",
          marginBottom:        "var(--space-8)",
        }}
      >
        <StatCard
          label="Articles"
          value={loading ? "—" : (data?.total_articles ?? 0)}
          icon={<BookOpen size={20} />}
        />
        <StatCard
          label="Vocabulary words"
          value={loading ? "—" : (data?.total_vocabulary ?? 0)}
          icon={<BookMarked size={20} />}
        />
        <StatCard
          label="Due for review"
          value={loading ? "—" : (data?.due_today ?? 0)}
          icon={<Clock size={20} />}
          accent={(data?.due_today ?? 0) > 0}
        />
        <StatCard
          label="Reviewed today"
          value={loading ? "—" : (data?.reviewed_today ?? 0)}
          icon={<CheckCircle2 size={20} />}
        />
      </div>

      {/* Quick actions */}
      <div
        style={{
          display:      "flex",
          gap:          "var(--space-3)",
          flexWrap:     "wrap",
          marginBottom: "var(--space-8)",
        }}
      >
        <Link href="/articles" className="btn-primary">
          <BookOpen size={16} />
          Import Article
        </Link>
        {(data?.due_today ?? 0) > 0 && (
          <Link href="/review" className="btn-primary">
            <RotateCcw size={16} />
            Start Review ({data!.due_today})
          </Link>
        )}
        <Link href="/vocabulary" className="btn-secondary">
          <BookMarked size={16} />
          Vocabulary
        </Link>
      </div>

      {/* Recent articles */}
      {!loading && (data?.recent_articles?.length ?? 0) > 0 && (
        <div
          style={{
            background:   "var(--color-paper-dark)",
            border:       "1px solid var(--color-paper-darker)",
            borderRadius: "var(--radius-lg)",
            padding:      "var(--space-6)",
            boxShadow:    "var(--shadow-card)",
          }}
        >
          <h2
            style={{
              fontFamily:    "var(--font-sans)",
              fontSize:      "var(--text-sm)",
              fontWeight:    "var(--font-semibold)",
              color:         "var(--color-ink-light)",
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              margin:        "0 0 var(--space-4)",
            }}
          >
            Recently Read
          </h2>
          {data!.recent_articles.map((a) => (
            <RecentArticleRow
              key={a.id}
              id={a.id}
              title={a.title}
              lastReadAt={a.last_read_at}
            />
          ))}
          <Link
            href="/articles"
            style={{
              display:        "inline-flex",
              alignItems:     "center",
              gap:            "var(--space-1)",
              fontFamily:     "var(--font-sans)",
              fontSize:       "var(--text-sm)",
              color:          "var(--color-accent)",
              textDecoration: "none",
              marginTop:      "var(--space-4)",
            }}
          >
            All articles <ChevronRight size={14} />
          </Link>
        </div>
      )}

      {/* Empty state */}
      {!loading && !error && (data?.total_articles ?? 0) === 0 && (
        <div
          style={{
            textAlign: "center",
            padding:   "var(--space-16) var(--space-8)",
          }}
        >
          <BookOpen
            size={48}
            style={{
              margin:  "0 auto var(--space-4)",
              color:   "var(--color-ink-faint)",
              display: "block",
            }}
          />
          <p
            style={{
              fontFamily:   "var(--font-serif)",
              fontSize:     "var(--text-lg)",
              color:        "var(--color-ink)",
              marginBottom: "var(--space-2)",
            }}
          >
            Import your first article to get started
          </p>
          <p
            style={{
              fontFamily:   "var(--font-sans)",
              fontSize:     "var(--text-sm)",
              color:        "var(--color-ink-light)",
              marginBottom: "var(--space-6)",
            }}
          >
            Upload a PDF, .docx, .epub, or paste plain text.
          </p>
          <Link href="/articles" className="btn-primary">
            <BookOpen size={16} />
            Import Article
          </Link>
        </div>
      )}
    </div>
  );
}
