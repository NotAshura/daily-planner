import { useMemo, useState } from "react";
import { ArrowLeft, Eye, FileText, Pencil, Plus, Search, Trash2 } from "lucide-react";
import type { Dict } from "../i18n";
import { renderMarkdown } from "../lib/markdown";
import type { NotePage } from "../types";

interface NotesPageProps {
  notes: NotePage[];
  locale: string;
  t: Dict;
  onCreate: () => string;
  onPatch: (id: string, patch: Partial<NotePage>) => void;
  onDelete: (id: string) => void;
}

/** First non-empty line of the body, used as a preview in the list. */
function excerpt(body: string): string {
  const line = body
    .split("\n")
    .map((l) => l.replace(/^[#>\-*+\s]+/, "").trim())
    .find((l) => l.length > 0);
  return line ?? "";
}

export default function NotesPage({ notes, locale, t, onCreate, onPatch, onDelete }: NotesPageProps) {
  const [openId, setOpenId] = useState<string | null>(null);
  const [editing, setEditing] = useState(true);
  const [query, setQuery] = useState("");

  const open = notes.find((note) => note.id === openId) ?? null;

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    const list = q
      ? notes.filter(
          (note) =>
            note.title.toLowerCase().includes(q) || note.body.toLowerCase().includes(q)
        )
      : notes;
    return [...list].sort((a, b) => b.updatedAt - a.updatedAt);
  }, [notes, query]);

  const formatDate = (ms: number) =>
    new Date(ms).toLocaleString(locale, {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (open) {
    return (
      <div className="mx-auto max-w-3xl space-y-4">
        <div className="flex items-center justify-between gap-2">
          <button
            onClick={() => setOpenId(null)}
            className="flex items-center gap-2 rounded-lg px-2 py-1 text-sm text-muted hover:bg-surface-2"
          >
            <ArrowLeft size={16} /> {t.notes.back}
          </button>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setEditing((prev) => !prev)}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-1.5 text-sm hover:bg-surface-2"
            >
              {editing ? <Eye size={16} /> : <Pencil size={16} />}
              {editing ? t.notes.preview : t.notes.edit}
            </button>
            <button
              onClick={() => {
                if (window.confirm(t.notes.deleteConfirm)) {
                  onDelete(open.id);
                  setOpenId(null);
                }
              }}
              className="flex items-center gap-1 rounded-lg px-2 py-1.5 text-sm text-red-500 hover:bg-red-500/10"
            >
              <Trash2 size={16} /> {t.notes.deleteNote}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-line bg-surface p-5">
          <input
            value={open.title}
            onChange={(e) => onPatch(open.id, { title: e.target.value })}
            placeholder={t.notes.titlePlaceholder}
            className="w-full border-none bg-transparent text-2xl font-bold outline-none placeholder:text-muted"
          />
          <p className="mt-1 text-xs text-muted">{t.notes.updated(formatDate(open.updatedAt))}</p>

          <div className="mt-4 border-t border-line pt-4">
            {editing ? (
              <textarea
                value={open.body}
                onChange={(e) => onPatch(open.id, { body: e.target.value })}
                placeholder={t.notes.bodyPlaceholder}
                rows={20}
                className="w-full resize-y rounded-lg border border-line bg-surface-2 p-3 font-mono text-sm leading-relaxed outline-none focus:border-blue-500"
              />
            ) : open.body.trim() ? (
              <div className="text-sm">{renderMarkdown(open.body)}</div>
            ) : (
              <p className="text-sm text-muted">{t.notes.emptyBody}</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="flex items-baseline justify-between gap-2">
        <div>
          <h2 className="text-2xl font-bold">{t.notes.title}</h2>
          <p className="text-sm text-muted">{t.notes.subtitle}</p>
        </div>
        <span className="text-xs text-muted">{t.notes.count(notes.length)}</span>
      </div>

      <div className="flex gap-2">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t.notes.search}
            className="w-full rounded-lg border border-line bg-surface-2 p-2 pl-9 outline-none focus:border-blue-500"
          />
        </div>
        <button
          onClick={() => {
            setOpenId(onCreate());
            setEditing(true);
          }}
          className="flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700"
        >
          <Plus size={18} />
          <span className="hidden sm:inline">{t.notes.newNote}</span>
        </button>
      </div>

      {visible.length === 0 ? (
        <p className="rounded-xl border border-line bg-surface p-5 text-sm text-muted">
          {notes.length === 0 ? t.notes.empty : t.notes.noMatches}
        </p>
      ) : (
        <ul className="space-y-2">
          {visible.map((note) => (
            <li key={note.id}>
              <button
                onClick={() => {
                  setOpenId(note.id);
                  setEditing(false);
                }}
                className="flex w-full items-start gap-3 rounded-xl border border-line bg-surface p-4 text-left transition hover:bg-surface-2"
              >
                <FileText size={18} className="mt-0.5 shrink-0 text-muted" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate font-semibold">
                    {note.title.trim() || t.notes.untitled}
                  </span>
                  {excerpt(note.body) && (
                    <span className="mt-0.5 block truncate text-sm text-muted">
                      {excerpt(note.body)}
                    </span>
                  )}
                </span>
                <span className="shrink-0 text-xs text-muted">{formatDate(note.updatedAt)}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
