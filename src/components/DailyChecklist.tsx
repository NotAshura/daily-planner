import { useState } from "react";
import { CheckCircle2, Circle, GripVertical, Plus, StickyNote } from "lucide-react";
import type { Dict } from "../i18n";
import { CATEGORY_DOT } from "../lib/categories";
import type { Task } from "../types";

interface DailyChecklistProps {
  tasks: Task[];
  doneIds: string[];
  notes: Record<string, string>;
  /** Start time of the first block of a task on the shown day, if any. */
  times: Record<string, string>;
  t: Dict;
  onToggle: (id: string) => void;
  onAdd: (title: string) => void;
  onOpen: (id: string) => void;
  onTaskPointerDown: (e: React.PointerEvent, task: Task) => void;
}

export default function DailyChecklist({
  tasks,
  doneIds,
  notes,
  times,
  t,
  onToggle,
  onAdd,
  onOpen,
  onTaskPointerDown,
}: DailyChecklistProps) {
  const [draft, setDraft] = useState("");

  const submit = () => {
    const title = draft.trim();
    if (!title) return;
    onAdd(title);
    setDraft("");
  };

  const doneCount = tasks.filter((task) => doneIds.includes(task.id)).length;
  const percent = tasks.length ? (doneCount / tasks.length) * 100 : 0;

  return (
    <section className="flex flex-col rounded-xl border border-line bg-surface p-5">
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <h2 className="text-lg font-semibold">{t.checklist.title}</h2>
        <span className="text-xs text-muted">{t.checklist.progress(doneCount, tasks.length)}</span>
      </div>

      <div className="mb-4 h-1.5 overflow-hidden rounded-full bg-surface-2">
        <div className="h-full rounded-full bg-emerald-500 transition-all" style={{ width: `${percent}%` }} />
      </div>

      {tasks.length === 0 ? (
        <p className="text-sm text-muted">{t.checklist.empty}</p>
      ) : (
        <ul className="space-y-2">
          {tasks.map((task) => {
            const done = doneIds.includes(task.id);
            return (
              <li
                key={task.id}
                onPointerDown={(e) => onTaskPointerDown(e, task)}
                className="flex touch-none select-none items-center gap-2 rounded-lg border border-line bg-surface-2 p-3"
              >
                <GripVertical size={14} className="shrink-0 cursor-grab text-muted" />

                <button
                  onPointerDown={(e) => e.stopPropagation()}
                  onClick={() => onToggle(task.id)}
                  aria-pressed={done}
                  aria-label={task.title}
                  className="shrink-0"
                >
                  {done ? (
                    <CheckCircle2 size={20} className="text-emerald-500" />
                  ) : (
                    <Circle size={20} className="text-muted" />
                  )}
                </button>

                <button
                  onClick={() => onOpen(task.id)}
                  title={t.checklist.openDetails}
                  className={`flex min-w-0 flex-1 items-center gap-2 text-left ${
                    done ? "text-muted line-through" : ""
                  }`}
                >
                  <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${CATEGORY_DOT[task.category]}`} />
                  <span className="truncate">{task.title}</span>
                  {notes[task.id]?.trim() && (
                    <StickyNote size={14} className="shrink-0 text-muted" aria-label={t.checklist.hasNote} />
                  )}
                </button>

                {times[task.id] && (
                  <span className="shrink-0 font-mono text-xs text-muted">{times[task.id]}</span>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <p className="mt-3 text-xs text-muted">{t.checklist.dragHint}</p>

      <div className="mt-4 flex gap-2">
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder={t.checklist.newTask}
          className="flex-1 rounded-lg border border-line bg-surface-2 p-2 outline-none focus:border-blue-500"
        />
        <button
          onClick={submit}
          aria-label={t.common.add}
          className="rounded-lg bg-blue-600 px-4 text-white hover:bg-blue-700"
        >
          <Plus size={18} />
        </button>
      </div>
    </section>
  );
}
