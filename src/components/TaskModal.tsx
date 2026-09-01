import { useEffect } from "react";
import { Trash2, X } from "lucide-react";
import type { Dict } from "../i18n";
import { CATEGORIES, CATEGORY_DOT } from "../lib/categories";
import { minToClock } from "../lib/date";
import type { Block, Category, Task } from "../types";

interface TaskModalProps {
  task: Task;
  /** Notes of the shown day, keyed by task id and by block id. */
  notes: Record<string, string>;
  /** Time blocks of this task on the shown day, in clock order. */
  dayBlocks: Block[];
  done: boolean;
  dateLabel: string;
  t: Dict;
  onPatch: (patch: Partial<Task>) => void;
  onNoteChange: (id: string, note: string) => void;
  onToggleDone: () => void;
  onDelete: () => void;
  onClose: () => void;
}

export default function TaskModal({
  task,
  notes,
  dayBlocks,
  done,
  dateLabel,
  t,
  onPatch,
  onNoteChange,
  onToggleDone,
  onDelete,
  onClose,
}: TaskModalProps) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.taskModal.title}
      onClick={onClose}
    >
      <div
        className="max-h-[90vh] w-full max-w-md space-y-4 overflow-y-auto rounded-xl border border-line bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t.taskModal.title}</h3>
          <button onClick={onClose} aria-label={t.common.close} className="rounded p-1 hover:bg-surface-2">
            <X size={20} />
          </button>
        </div>

        <label className="block">
          <span className="text-sm text-muted">{t.taskModal.titleLabel}</span>
          <input
            value={task.title}
            onChange={(e) => onPatch({ title: e.target.value })}
            className="mt-1 w-full rounded-lg border border-line bg-surface-2 p-2 outline-none focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-muted">{t.taskModal.categoryLabel}</span>
          <div className="mt-1 flex items-center gap-2">
            <span className={`h-3 w-3 shrink-0 rounded-full ${CATEGORY_DOT[task.category]}`} />
            <select
              value={task.category}
              onChange={(e) => onPatch({ category: e.target.value as Category })}
              className="w-full rounded-lg border border-line bg-surface-2 p-2 outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.categories[c]}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="block">
          <span className="text-sm text-muted">{t.taskModal.noteLabel}</span>
          <textarea
            value={notes[task.id] ?? ""}
            onChange={(e) => onNoteChange(task.id, e.target.value)}
            placeholder={t.taskModal.notePlaceholder}
            rows={4}
            className="mt-1 w-full resize-none rounded-lg border border-line bg-surface-2 p-2 outline-none focus:border-blue-500"
          />
          <span className="text-xs text-muted">{t.taskModal.noteHint(dateLabel)}</span>
        </label>

        {dayBlocks.length > 0 && (
          <div className="space-y-3 border-t border-line pt-4">
            <span className="text-sm text-muted">{t.taskModal.timeBlocks(dayBlocks.length)}</span>
            {dayBlocks.map((block) => {
              const range = `${minToClock(block.start)}–${minToClock(block.start + block.duration)}`;
              return (
                <label key={block.id} className="block">
                  <span className="font-mono text-xs">{range}</span>
                  <textarea
                    value={notes[block.id] ?? ""}
                    onChange={(e) => onNoteChange(block.id, e.target.value)}
                    placeholder={t.taskModal.blockNotePlaceholder}
                    rows={2}
                    className="mt-1 w-full resize-none rounded-lg border border-line bg-surface-2 p-2 text-sm outline-none focus:border-blue-500"
                  />
                </label>
              );
            })}
          </div>
        )}

        <label className="flex items-start gap-2 border-t border-line pt-4 text-sm">
          <input
            type="checkbox"
            checked={task.recurring}
            onChange={(e) => onPatch({ recurring: e.target.checked })}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            {t.appointment.recurring}
            <span className="block text-xs text-muted">{t.appointment.recurringHint}</span>
          </span>
        </label>

        <div className="flex items-center justify-between border-t border-line pt-4">
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={done} onChange={onToggleDone} className="h-4 w-4" />
            {t.taskModal.doneToday}
          </label>
          <button
            onClick={onDelete}
            title={t.taskModal.deleteWarning}
            className="flex items-center gap-1 rounded-lg px-2 py-1 text-sm text-red-500 hover:bg-red-500/10"
          >
            <Trash2 size={16} /> {t.taskModal.deleteTask}
          </button>
        </div>
      </div>
    </div>
  );
}
