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
  onReorder: (ids: string[]) => void;
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
  onReorder,
  onTaskPointerDown,
}: DailyChecklistProps) {
  const [draft, setDraft] = useState("");
  const [drag, setDrag] = useState<{ id: string; from: number; startY: number; rowHeight: number } | null>(
    null
  );
  const [dragY, setDragY] = useState(0);

  const submit = () => {
    const title = draft.trim();
    if (!title) return;
    onAdd(title);
    setDraft("");
  };

  const clamp = (value: number, max: number) => Math.min(max, Math.max(0, value));
  // Derived from the travelled distance, so the shifting rows cannot influence the target.
  const targetIndex = drag ? clamp(drag.from + Math.round(dragY / drag.rowHeight), tasks.length - 1) : -1;

  const startReorder = (e: React.PointerEvent, index: number, id: string) => {
    e.stopPropagation();
    const row = e.currentTarget.closest("li");
    if (!row) return;
    e.currentTarget.setPointerCapture(e.pointerId);
    setDrag({ id, from: index, startY: e.clientY, rowHeight: row.getBoundingClientRect().height + 8 });
    setDragY(0);
  };

  const endReorder = () => {
    if (drag && targetIndex !== drag.from) {
      const ids = tasks.map((task) => task.id);
      ids.splice(targetIndex, 0, ids.splice(drag.from, 1)[0]);
      onReorder(ids);
    }
    setDrag(null);
    setDragY(0);
  };

  /** How far a row slides while another one is dragged past it. */
  const shiftOf = (index: number) => {
    if (!drag || index === drag.from) return 0;
    if (drag.from < targetIndex && index > drag.from && index <= targetIndex) return -drag.rowHeight;
    if (drag.from > targetIndex && index >= targetIndex && index < drag.from) return drag.rowHeight;
    return 0;
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
        <ul
          className="space-y-2"
          onPointerMove={(e) => drag && setDragY(e.clientY - drag.startY)}
          onPointerUp={endReorder}
          onPointerCancel={endReorder}
        >
          {tasks.map((task, index) => {
            const done = doneIds.includes(task.id);
            const dragged = drag?.id === task.id;
            return (
              <li
                key={task.id}
                onPointerDown={(e) => onTaskPointerDown(e, task)}
                style={{ transform: `translateY(${dragged ? dragY : shiftOf(index)}px)` }}
                className={`flex touch-none select-none items-center gap-2 rounded-lg border bg-surface-2 p-3 ${
                  dragged
                    ? "relative z-10 border-blue-500 shadow-xl shadow-black/30"
                    : `border-line ${drag ? "transition-transform duration-150" : ""}`
                }`}
              >
                <button
                  onPointerDown={(e) => startReorder(e, index, task.id)}
                  aria-label={t.checklist.reorder}
                  title={t.checklist.reorder}
                  className={`shrink-0 text-muted ${dragged ? "cursor-grabbing" : "cursor-grab"}`}
                >
                  <GripVertical size={14} />
                </button>

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
                  onDoubleClick={() => onOpen(task.id)}
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
