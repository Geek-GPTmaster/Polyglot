"use client";

import { useCallback, useEffect, useState } from "react";
import { BookMarked, Plus, Trash2, Search, Tag } from "lucide-react";
import { useLanguage } from "@/lib/context/LanguageContext";
import {
  fetchVocabulary,
  fetchTags,
  deleteVocabularyEntry,
  updateVocabularyEntry,
  createVocabularyEntry,
  fetchDefinition,
} from "@/lib/api";
import { useToast } from "@/components/Toast";
import Button from "@/components/Button";
import Modal from "@/components/Modal";
import TagChip from "@/components/TagChip";
import type { Tag as TagType, VocabularyEntry } from "@/lib/types";

// ---------------------------------------------------------------------------
// Add-word modal
// ---------------------------------------------------------------------------

function AddWordModal({
  open,
  onClose,
  onAdded,
  language,
  tags,
}: {
  open: boolean;
  onClose: () => void;
  onAdded: (entry: VocabularyEntry) => void;
  language: string;
  tags: TagType[];
}) {
  const { toast }           = useToast();
  const [word, setWord]     = useState("");
  const [notes, setNotes]   = useState("");
  const [tagId, setTagId]   = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  // Auto-fetch definition preview when word is typed
  useEffect(() => {
    if (word.trim().length < 2) { setPreview(null); return; }
    const t = setTimeout(async () => {
      try {
        const def = await fetchDefinition(word.trim(), language);
        setPreview(def?.definition ?? null);
      } catch { setPreview(null); }
    }, 600);
    return () => clearTimeout(t);
  }, [word, language]);

  function reset() { setWord(""); setNotes(""); setTagId(null); setPreview(null); }

  async function handleAdd() {
    if (!word.trim()) return;
    setLoading(true);
    try {
      const entry = await createVocabularyEntry({ word: word.trim(), language_code: language });
      if (notes || tagId != null) {
        await updateVocabularyEntry(entry.id, { notes: notes || null, tag_id: tagId });
      }
      toast(`"${word.trim()}" added to vocabulary.`);
      reset();
      onAdded(entry);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : "";
      toast(msg.includes("409") ? `"${word}" is already in vocabulary.` : "Failed to add word.", "error");
    } finally { setLoading(false); }
  }

  const inputStyle: React.CSSProperties = {
    width: "100%", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)",
    color: "var(--color-ink)", background: "var(--color-paper)",
    border: "1px solid var(--color-paper-darker)", borderRadius: "var(--radius-md)",
    padding: "var(--space-3) var(--space-4)", outline: "none",
  };

  return (
    <Modal open={open} onClose={() => { reset(); onClose(); }} title="Add Word">
      <div style={{ display: "flex", flexDirection: "column", gap: "var(--space-4)" }}>
        <div>
          <label style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "block", marginBottom: "var(--space-2)" }}>Word</label>
          <input autoFocus type="text" value={word} onChange={(e) => setWord(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
            placeholder="e.g. ephemeral" style={inputStyle} />
          {preview && (
            <p style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", marginTop: "var(--space-2)", fontStyle: "italic" }}>
              {preview}
            </p>
          )}
        </div>

        <div>
          <label style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "block", marginBottom: "var(--space-2)" }}>Notes <span style={{ color: "var(--color-ink-faint)" }}>(optional)</span></label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)}
            placeholder="Your notes…" rows={2}
            style={{ ...inputStyle, resize: "vertical" }} />
        </div>

        {tags.length > 0 && (
          <div>
            <label style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", display: "block", marginBottom: "var(--space-2)" }}>Tag</label>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "var(--space-2)" }}>
              <TagChip label="None" active={tagId === null} onClick={() => setTagId(null)} />
              {tags.map((t) => <TagChip key={t.id} label={t.name} active={tagId === t.id} onClick={() => setTagId(t.id)} />)}
            </div>
          </div>
        )}

        <div style={{ display: "flex", justifyContent: "flex-end", gap: "var(--space-3)" }}>
          <Button variant="secondary" onClick={() => { reset(); onClose(); }}>Cancel</Button>
          <Button onClick={handleAdd} loading={loading} disabled={!word.trim()}>Add</Button>
        </div>
      </div>
    </Modal>
  );
}

// ---------------------------------------------------------------------------
// Vocabulary row
// ---------------------------------------------------------------------------

function VocabRow({
  entry,
  tags,
  onDelete,
  onUpdate,
}: {
  entry: VocabularyEntry;
  tags: TagType[];
  onDelete: (id: number) => void;
  onUpdate: (id: number, data: { notes?: string | null; tag_id?: number | null }) => void;
}) {
  const { toast }               = useToast();
  const [editingNotes, setEditingNotes] = useState(false);
  const [notes, setNotes]               = useState(entry.notes ?? "");
  const [confirming, setConfirming]     = useState(false);
  const [tagOpen, setTagOpen]           = useState(false);
  const [saving, setSaving]             = useState(false);

  async function saveNotes() {
    setSaving(true);
    try {
      await onUpdate(entry.id, { notes: notes.trim() || null });
      setEditingNotes(false);
    } catch { toast("Failed to save notes.", "error"); }
    finally { setSaving(false); }
  }

  async function setTag(tagId: number | null) {
    setTagOpen(false);
    try { await onUpdate(entry.id, { tag_id: tagId }); }
    catch { toast("Failed to update tag.", "error"); }
  }

  const nextReview = new Date(entry.next_review_at).toLocaleDateString(undefined, { month: "short", day: "numeric" });

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "1fr auto",
        gap: "var(--space-4)",
        padding: "var(--space-4) 0",
        borderBottom: "1px solid var(--color-paper-darker)",
        alignItems: "start",
      }}
    >
      {/* Left: word + definition + notes */}
      <div>
        <div style={{ display: "flex", alignItems: "baseline", gap: "var(--space-3)", flexWrap: "wrap", marginBottom: "var(--space-1)" }}>
          <span style={{ fontFamily: "var(--font-serif-alt)", fontSize: "var(--text-md)", fontWeight: "var(--font-semibold)", color: "var(--color-ink)" }}>
            {entry.word}
          </span>
          {entry.phonetics && (
            <span style={{ fontFamily: "var(--font-mono)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)" }}>{entry.phonetics}</span>
          )}
          {entry.part_of_speech && (
            <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-accent)", fontStyle: "italic" }}>{entry.part_of_speech}</span>
          )}
        </div>

        {entry.definition && (
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", margin: "0 0 var(--space-2)", lineHeight: "var(--leading-normal)" }}>
            {entry.definition}
          </p>
        )}

        {/* Notes inline edit */}
        {editingNotes ? (
          <div style={{ display: "flex", gap: "var(--space-2)", alignItems: "flex-start" }}>
            <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} autoFocus
              style={{ flex: 1, fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink)", background: "var(--color-paper)", border: "1px solid var(--color-paper-darker)", borderRadius: "var(--radius-sm)", padding: "var(--space-2)", resize: "none", outline: "none" }} />
            <Button size="sm" onClick={saveNotes} loading={saving}>Save</Button>
            <Button size="sm" variant="secondary" onClick={() => { setNotes(entry.notes ?? ""); setEditingNotes(false); }}>Cancel</Button>
          </div>
        ) : (
          <button onClick={() => setEditingNotes(true)}
            style={{ background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: entry.notes ? "var(--color-ink-light)" : "var(--color-ink-faint)", padding: 0, textAlign: "left" }}>
            {entry.notes ?? "Add notes…"}
          </button>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-3)", marginTop: "var(--space-2)", flexWrap: "wrap" }}>
          {/* Tag selector */}
          <div style={{ position: "relative" }}>
            <button onClick={() => setTagOpen((o) => !o)}
              style={{ display: "flex", alignItems: "center", gap: "var(--space-1)", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-light)", padding: 0 }}>
              <Tag size={11} />
              {entry.tag ? <TagChip label={entry.tag.name} active /> : <span>Add tag</span>}
            </button>
            {tagOpen && (
              <div style={{ position: "absolute", top: "100%", left: 0, zIndex: 50, background: "var(--color-paper-dark)", border: "1px solid var(--color-paper-darker)", borderRadius: "var(--radius-md)", boxShadow: "var(--shadow-md)", padding: "var(--space-2)", minWidth: "160px", marginTop: "var(--space-1)" }}>
                <button onClick={() => setTag(null)} style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)" }}>None</button>
                {tags.map((t) => (
                  <button key={t.id} onClick={() => setTag(t.id)} style={{ display: "block", width: "100%", textAlign: "left", background: entry.tag?.id === t.id ? "var(--color-accent-faint)" : "none", border: "none", cursor: "pointer", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: entry.tag?.id === t.id ? "var(--color-accent-dark)" : "var(--color-ink)", padding: "var(--space-2) var(--space-3)", borderRadius: "var(--radius-sm)" }}>{t.name}</button>
                ))}
              </div>
            )}
          </div>

          <span style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-xs)", color: "var(--color-ink-faint)" }}>
            Review {nextReview} · {entry.repetitions} rep{entry.repetitions !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Right: delete */}
      <div style={{ display: "flex", flexDirection: "column", alignItems: "flex-end", gap: "var(--space-2)" }}>
        {confirming ? (
          <div style={{ display: "flex", gap: "var(--space-2)" }}>
            <Button size="sm" variant="danger" onClick={() => { setConfirming(false); onDelete(entry.id); }}>Delete</Button>
            <Button size="sm" variant="secondary" onClick={() => setConfirming(false)}>Cancel</Button>
          </div>
        ) : (
          <button className="btn-ghost" onClick={() => setConfirming(true)} aria-label="Delete word">
            <Trash2 size={15} />
          </button>
        )}
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Vocabulary page
// ---------------------------------------------------------------------------

export default function VocabularyPage() {
  const { activeLang } = useLanguage();
  const { toast }      = useToast();

  const [entries, setEntries]   = useState<VocabularyEntry[]>([]);
  const [tags, setTags]         = useState<TagType[]>([]);
  const [loading, setLoading]   = useState(true);
  const [search, setSearch]     = useState("");
  const [activeTag, setActiveTag] = useState<number | null>(null);
  const [addOpen, setAddOpen]   = useState(false);

  const load = useCallback(() => {
    setLoading(true);
    Promise.all([fetchVocabulary(activeLang), fetchTags()])
      .then(([v, t]) => { setEntries(v); setTags(t); })
      .catch(() => toast("Failed to load vocabulary.", "error"))
      .finally(() => setLoading(false));
  }, [activeLang, toast]);

  useEffect(() => { load(); }, [load]);

  const filtered = entries.filter((e) => {
    if (activeTag != null && e.tag?.id !== activeTag) return false;
    if (search && !e.word.toLowerCase().startsWith(search.toLowerCase())) return false;
    return true;
  });

  async function handleDelete(id: number) {
    try {
      await deleteVocabularyEntry(id);
      setEntries((prev) => prev.filter((e) => e.id !== id));
      toast("Word deleted.");
    } catch { toast("Failed to delete.", "error"); }
  }

  async function handleUpdate(id: number, data: { notes?: string | null; tag_id?: number | null }) {
    const updated = await updateVocabularyEntry(id, data);
    setEntries((prev) => prev.map((e) => (e.id === id ? updated : e)));
  }

  return (
    <div className="page-container">
      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "var(--space-6)", flexWrap: "wrap", gap: "var(--space-4)" }}>
        <div>
          <h1 style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-xl)", fontWeight: "var(--font-semibold)", color: "var(--color-ink)", margin: 0 }}>Vocabulary</h1>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-light)", marginTop: "var(--space-1)" }}>
            {activeLang.toUpperCase()} · {entries.length} word{entries.length !== 1 ? "s" : ""}
          </p>
        </div>
        <Button onClick={() => setAddOpen(true)}><Plus size={16} />Add Word</Button>
      </div>

      {/* Search + tag filters */}
      <div style={{ display: "flex", gap: "var(--space-3)", marginBottom: "var(--space-6)", flexWrap: "wrap", alignItems: "center" }}>
        <div style={{ position: "relative", flex: "1 1 200px", minWidth: "160px" }}>
          <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "var(--color-ink-faint)", pointerEvents: "none" }} />
          <input type="text" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search words…"
            style={{ width: "100%", paddingLeft: "var(--space-8)", paddingRight: "var(--space-4)", paddingTop: "var(--space-2)", paddingBottom: "var(--space-2)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink)", background: "var(--color-paper-dark)", border: "1px solid var(--color-paper-darker)", borderRadius: "var(--radius-md)", outline: "none" }} />
        </div>
        <div style={{ display: "flex", gap: "var(--space-2)", flexWrap: "wrap" }}>
          <TagChip label="All" active={activeTag === null} onClick={() => setActiveTag(null)} />
          {tags.map((t) => <TagChip key={t.id} label={t.name} active={activeTag === t.id} onClick={() => setActiveTag(activeTag === t.id ? null : t.id)} />)}
        </div>
      </div>

      {/* List */}
      {loading ? (
        <div style={{ textAlign: "center", padding: "var(--space-16)", fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)", color: "var(--color-ink-faint)" }}>Loading…</div>
      ) : filtered.length === 0 ? (
        <div style={{ textAlign: "center", padding: "var(--space-16)", color: "var(--color-ink-faint)" }}>
          <BookMarked size={40} style={{ margin: "0 auto var(--space-4)", display: "block" }} />
          <p style={{ fontFamily: "var(--font-serif)", fontSize: "var(--text-lg)", color: "var(--color-ink)", marginBottom: "var(--space-2)" }}>
            {entries.length === 0 ? "No words saved yet" : "No words match your filters"}
          </p>
          <p style={{ fontFamily: "var(--font-sans)", fontSize: "var(--text-sm)" }}>
            {entries.length === 0 ? "Click a word while reading to save it here." : "Try a different search or tag."}
          </p>
        </div>
      ) : (
        <div style={{ background: "var(--color-paper-dark)", border: "1px solid var(--color-paper-darker)", borderRadius: "var(--radius-lg)", padding: "0 var(--space-4)", boxShadow: "var(--shadow-card)" }}>
          {filtered.map((e) => (
            <VocabRow key={e.id} entry={e} tags={tags} onDelete={handleDelete} onUpdate={handleUpdate} />
          ))}
        </div>
      )}

      <AddWordModal open={addOpen} onClose={() => setAddOpen(false)} onAdded={(e) => setEntries((prev) => [e, ...prev])} language={activeLang} tags={tags} />
    </div>
  );
}
