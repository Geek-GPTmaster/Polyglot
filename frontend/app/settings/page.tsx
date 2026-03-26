"use client";

import { useCallback, useEffect, useState } from "react";
import { Plus, Pencil, Trash2, Check, X, Download } from "lucide-react";
import {
  fetchTags,
  createTag,
  updateTag,
  deleteTag,
  fetchSettings,
  updateSettings,
  buildExportURL,
} from "@/lib/api";
import { getFontSize, setFontSize as storeFontSize } from "@/lib/storage";
import { useToast } from "@/components/Toast";
import { useLanguage } from "@/lib/context/LanguageContext";
import Button from "@/components/Button";
import type { Tag, FontSize } from "@/lib/types";

// ---------------------------------------------------------------------------
// Section wrapper
// ---------------------------------------------------------------------------

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section style={{ marginBottom: "var(--space-10)" }}>
      <h2
        style={{
          fontFamily:   "var(--font-serif)",
          fontSize:     "var(--text-lg)",
          fontWeight:   "var(--font-semibold)",
          color:        "var(--color-ink)",
          margin:       "0 0 var(--space-4)",
          paddingBottom: "var(--space-2)",
          borderBottom: "1px solid var(--color-paper-darker)",
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

// ---------------------------------------------------------------------------
// Tag row (inline edit)
// ---------------------------------------------------------------------------

function TagRow({
  tag,
  onUpdated,
  onDeleted,
}: {
  tag: Tag;
  onUpdated: (t: Tag) => void;
  onDeleted: (id: number) => void;
}) {
  const { toast } = useToast();
  const [editing, setEditing]           = useState(false);
  const [name, setName]                 = useState(tag.name);
  const [saving, setSaving]             = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  async function handleSave() {
    if (!name.trim() || name.trim() === tag.name) { setEditing(false); setName(tag.name); return; }
    setSaving(true);
    try {
      const updated = await updateTag(tag.id, name.trim());
      onUpdated(updated);
      setEditing(false);
    } catch {
      toast("Failed to update tag.", "error");
    } finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    try {
      await deleteTag(tag.id);
      onDeleted(tag.id);
      toast(`Tag "${tag.name}" deleted.`);
    } catch {
      toast("Failed to delete tag.", "error");
    }
  }

  const rowStyle: React.CSSProperties = {
    display:        "flex",
    alignItems:     "center",
    gap:            "var(--space-3)",
    padding:        "var(--space-2) var(--space-3)",
    borderRadius:   "var(--radius-md)",
    background:     "var(--color-paper-dark)",
    border:         "1px solid var(--color-paper-darker)",
  };

  return (
    <div style={rowStyle}>
      {editing ? (
        <>
          <input
            autoFocus
            value={name}
            onChange={(e) => setName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") handleSave(); if (e.key === "Escape") { setEditing(false); setName(tag.name); }}}
            style={{
              flex:         1,
              fontFamily:   "var(--font-sans)",
              fontSize:     "var(--text-sm)",
              color:        "var(--color-ink)",
              background:   "var(--color-paper)",
              border:       "1px solid var(--color-paper-darker)",
              borderRadius: "var(--radius-sm)",
              padding:      "var(--space-1) var(--space-2)",
              outline:      "none",
            }}
          />
          <button onClick={handleSave} disabled={saving} aria-label="Save" className="btn-ghost" style={{ color: "var(--color-accent)", padding: "4px" }}>
            <Check size={15} />
          </button>
          <button onClick={() => { setEditing(false); setName(tag.name); }} className="btn-ghost" style={{ padding: "4px" }}>
            <X size={15} />
          </button>
        </>
      ) : (
        <>
          <span style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink)" }}>
            {tag.name}
          </span>
          {confirmDelete ? (
            <>
              <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)" }}>Delete?</span>
              <button
                onClick={handleDelete}
                style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", fontWeight: "var(--font-medium)", color: "#fff", background: "var(--color-error)", border: "none", borderRadius: "var(--radius-sm)", padding: "2px 8px", cursor: "pointer" }}
              >Yes</button>
              <button
                onClick={() => setConfirmDelete(false)}
                style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", background: "transparent", border: "none", cursor: "pointer" }}
              >No</button>
            </>
          ) : (
            <>
              <button onClick={() => setEditing(true)} className="btn-ghost" style={{ padding: "4px", color: "var(--color-ink-faint)" }} aria-label="Edit">
                <Pencil size={13} />
              </button>
              <button onClick={() => setConfirmDelete(true)} className="btn-ghost" style={{ padding: "4px", color: "var(--color-ink-faint)" }} aria-label="Delete">
                <Trash2 size={13} />
              </button>
            </>
          )}
        </>
      )}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Settings page
// ---------------------------------------------------------------------------

export default function SettingsPage() {
  const { toast }       = useToast();
  const { activeLang }  = useLanguage();

  // Tags
  const [tags, setTags]           = useState<Tag[]>([]);
  const [tagsLoading, setTagsLoading] = useState(true);
  const [newTagName, setNewTagName]   = useState("");
  const [addingTag, setAddingTag]     = useState(false);

  // Settings (backend key-value)
  const [dailyLimit, setDailyLimit]     = useState("20");
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [savingLimit, setSavingLimit]   = useState(false);

  // Font size (local)
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");

  // Load everything on mount
  useEffect(() => {
    setFontSizeState(getFontSize());

    fetchTags()
      .then(setTags)
      .catch(() => toast("Failed to load tags.", "error"))
      .finally(() => setTagsLoading(false));

    fetchSettings()
      .then((s) => { if (s.daily_review_limit) setDailyLimit(s.daily_review_limit); })
      .catch(() => {})
      .finally(() => setSettingsLoading(false));
  }, [toast]);

  // Font size change
  function handleFontSize(size: FontSize) {
    setFontSizeState(size);
    storeFontSize(size);
    document.body.dataset.fontSize = size;
  }

  // Daily limit save
  async function handleSaveDailyLimit() {
    const n = parseInt(dailyLimit, 10);
    if (isNaN(n) || n < 1 || n > 200) { toast("Enter a number between 1 and 200.", "error"); return; }
    setSavingLimit(true);
    try {
      await updateSettings({ daily_review_limit: String(n) });
      toast("Daily limit saved.");
    } catch {
      toast("Failed to save setting.", "error");
    } finally {
      setSavingLimit(false);
    }
  }

  // Add tag
  async function handleAddTag() {
    if (!newTagName.trim()) return;
    setAddingTag(true);
    try {
      const tag = await createTag(newTagName.trim());
      setTags((prev) => [...prev, tag]);
      setNewTagName("");
      toast(`Tag "${tag.name}" created.`);
    } catch {
      toast("Failed to create tag.", "error");
    } finally {
      setAddingTag(false);
    }
  }

  const handleTagUpdated = useCallback((updated: Tag) => {
    setTags((prev) => prev.map((t) => (t.id === updated.id ? updated : t)));
  }, []);

  const handleTagDeleted = useCallback((id: number) => {
    setTags((prev) => prev.filter((t) => t.id !== id));
  }, []);

  // Export URL
  const exportURL = buildExportURL(activeLang);

  // ── Render ────────────────────────────────────────────────

  const fontSizeOptions: { value: FontSize; label: string }[] = [
    { value: "small",  label: "Small"  },
    { value: "medium", label: "Medium" },
    { value: "large",  label: "Large"  },
  ];

  return (
    <div className="page-container" style={{ maxWidth: "600px" }}>
      <h1
        style={{
          fontFamily: "var(--font-serif)",
          fontSize:   "var(--text-2xl)",
          fontWeight: "var(--font-semibold)",
          color:      "var(--color-ink)",
          margin:     "0 0 var(--space-8)",
        }}
      >
        Settings
      </h1>

      {/* ── Reading ── */}
      <Section title="Reading">
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", margin: "0 0 var(--space-3)" }}>
          Article font size
        </p>
        <div style={{ display: "flex", gap: "var(--space-2)" }}>
          {fontSizeOptions.map(({ value, label }) => (
            <button
              key={value}
              onClick={() => handleFontSize(value)}
              style={{
                fontFamily:   "var(--font-sans)",
                fontSize:     "var(--text-sm)",
                fontWeight:   fontSize === value ? "var(--font-medium)" : "400",
                color:        fontSize === value ? "var(--color-paper)" : "var(--color-ink-light)",
                background:   fontSize === value ? "var(--color-ink)" : "var(--color-paper-dark)",
                border:       "1px solid",
                borderColor:  fontSize === value ? "var(--color-ink)" : "var(--color-paper-darker)",
                borderRadius: "var(--radius-full)",
                padding:      "var(--space-1) var(--space-5)",
                cursor:       "pointer",
                transition:   "all 150ms ease",
              }}
            >
              {label}
            </button>
          ))}
        </div>
      </Section>

      {/* ── Review ── */}
      <Section title="Review">
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", margin: "0 0 var(--space-3)" }}>
          Daily review limit (words per day)
        </p>
        {settingsLoading ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)" }}>Loading…</p>
        ) : (
          <div style={{ display: "flex", gap: "var(--space-3)", alignItems: "center", maxWidth: "260px" }}>
            <input
              type="number"
              min={1}
              max={200}
              value={dailyLimit}
              onChange={(e) => setDailyLimit(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") handleSaveDailyLimit(); }}
              style={{
                flex:         1,
                fontFamily:   "var(--font-sans)",
                fontSize:     "var(--text-sm)",
                color:        "var(--color-ink)",
                background:   "var(--color-paper)",
                border:       "1px solid var(--color-paper-darker)",
                borderRadius: "var(--radius-md)",
                padding:      "var(--space-2) var(--space-3)",
                outline:      "none",
              }}
            />
            <Button size="sm" onClick={handleSaveDailyLimit} loading={savingLimit}>
              Save
            </Button>
          </div>
        )}
      </Section>

      {/* ── Tags ── */}
      <Section title="Tags">
        {tagsLoading ? (
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)" }}>Loading…</p>
        ) : (
          <>
            {tags.length > 0 ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-2)", marginBottom: "var(--space-4)" }}>
                {tags.map((tag) => (
                  <TagRow
                    key={tag.id}
                    tag={tag}
                    onUpdated={handleTagUpdated}
                    onDeleted={handleTagDeleted}
                  />
                ))}
              </div>
            ) : (
              <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)", marginBottom: "var(--space-4)" }}>
                No tags yet.
              </p>
            )}

            {/* Add tag */}
            <div style={{ display: "flex", gap: "var(--space-2)", maxWidth: "340px" }}>
              <input
                value={newTagName}
                onChange={(e) => setNewTagName(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleAddTag(); }}
                placeholder="New tag name…"
                style={{
                  flex:         1,
                  fontFamily:   "var(--font-sans)",
                  fontSize:     "var(--text-sm)",
                  color:        "var(--color-ink)",
                  background:   "var(--color-paper)",
                  border:       "1px solid var(--color-paper-darker)",
                  borderRadius: "var(--radius-md)",
                  padding:      "var(--space-2) var(--space-3)",
                  outline:      "none",
                }}
              />
              <Button size="sm" onClick={handleAddTag} loading={addingTag} disabled={!newTagName.trim()}>
                <Plus size={14} /> Add
              </Button>
            </div>
          </>
        )}
      </Section>

      {/* ── Export ── */}
      <Section title="Export">
        <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", margin: "0 0 var(--space-4)" }}>
          Download your vocabulary list as a CSV file.
        </p>
        <a href={exportURL} download>
          <Button variant="secondary">
            <Download size={14} /> Export Vocabulary ({activeLang.toUpperCase()})
          </Button>
        </a>
      </Section>
    </div>
  );
}
