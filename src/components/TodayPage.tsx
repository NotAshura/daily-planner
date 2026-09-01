import { useMemo, useState } from "react";
import type { Dict } from "../i18n";
import { formatHours, minToClock, parseKey } from "../lib/date";
import type { Block, Category, Completions, Task } from "../types";
import CalendarGrid from "./calendar/CalendarGrid";
import DragGhost from "./calendar/DragGhost";
import { useCalendarDrag, type DraftRange } from "./calendar/useCalendarDrag";
import DailyChecklist from "./DailyChecklist";
import NewAppointmentDialog from "./NewAppointmentDialog";

interface TodayPageProps {
  today: string;
  checklistTasks: Task[];
  tasks: Task[];
  blocks: Block[];
  completions: Completions;
  notes: Record<string, string>;
  locale: string;
  t: Dict;
  onAddTask: (title: string) => void;
  onReorderTasks: (ids: string[]) => void;
  onToggleDone: (date: string, taskId: string) => void;
  onOpenTask: (id: string) => void;
  onCreateBlock: (taskId: string, date: string, start: number) => void;
  onCreateTaskWithBlock: (
    title: string,
    category: Category,
    recurring: boolean,
    range: DraftRange
  ) => void;
  onUpdateBlock: (id: string, patch: Partial<Block>) => void;
  onDeleteBlock: (id: string) => void;
}

export default function TodayPage({
  today,
  checklistTasks,
  tasks,
  blocks,
  completions,
  notes,
  locale,
  t,
  onAddTask,
  onReorderTasks,
  onToggleDone,
  onOpenTask,
  onCreateBlock,
  onCreateTaskWithBlock,
  onUpdateBlock,
  onDeleteBlock,
}: TodayPageProps) {
  const [pendingRange, setPendingRange] = useState<DraftRange | null>(null);

  const days = useMemo(() => [parseKey(today)], [today]);
  const dayKeys = useMemo(() => [today], [today]);

  const drag = useCalendarDrag({
    days: dayKeys,
    blocks,
    onCreateBlock,
    onUpdateBlock,
    onDraw: setPendingRange,
  });

  const todayBlocks = useMemo(
    () => blocks.filter((block) => block.date === today).sort((a, b) => a.start - b.start),
    [blocks, today]
  );

  const times = useMemo(() => {
    const map: Record<string, string> = {};
    for (const block of todayBlocks) {
      map[block.taskId] ??= minToClock(block.start);
    }
    return map;
  }, [todayBlocks]);

  // Planned tasks run in clock order, everything else keeps the order dragged in the checklist.
  const orderedTasks = useMemo(() => {
    const starts = new Map<string, number>();
    for (const block of todayBlocks) {
      if (!starts.has(block.taskId)) starts.set(block.taskId, block.start);
    }
    return [...checklistTasks].sort((a, b) => {
      const aStart = starts.get(a.id);
      const bStart = starts.get(b.id);
      if (aStart !== undefined && bStart !== undefined) return aStart - bStart;
      if (aStart !== undefined) return -1;
      if (bStart !== undefined) return 1;
      return (a.order ?? Number.MAX_SAFE_INTEGER) - (b.order ?? Number.MAX_SAFE_INTEGER);
    });
  }, [checklistTasks, todayBlocks]);

  const closeDialog = () => {
    setPendingRange(null);
    drag.clearDraft();
  };

  const dayLabel = parseKey(today).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-bold">{t.nav.today}</h2>
        <p className="text-sm text-muted">{dayLabel}</p>
      </div>

      <div className="grid items-start gap-4 lg:grid-cols-2">
        <DailyChecklist
          tasks={orderedTasks}
          doneIds={completions[today] ?? []}
          notes={notes}
          times={times}
          t={t}
          onToggle={(id) => onToggleDone(today, id)}
          onAdd={onAddTask}
          onOpen={onOpenTask}
          onReorder={onReorderTasks}
          onTaskPointerDown={drag.startCreate}
        />

        <section className="rounded-xl border border-line bg-surface p-5">
          <div className="mb-1 flex items-baseline justify-between gap-2">
            <h2 className="text-lg font-semibold">{t.schedule.title}</h2>
            <span className="text-xs text-muted">
              {t.schedule.plannedTotal}:{" "}
              {formatHours(todayBlocks.reduce((sum, block) => sum + block.duration, 0))}
            </span>
          </div>
          <p className="mb-3 text-xs text-muted">{t.schedule.drawHint}</p>

          <CalendarGrid
            days={days}
            blocks={blocks}
            tasks={tasks}
            completions={completions}
            draft={drag.draft}
            gridRef={drag.gridRef}
            t={t}
            scrollToNow
            className="max-h-[60vh] rounded-lg border border-line"
            onStartMove={drag.startMove}
            onStartResize={drag.startResize}
            onStartDraw={drag.startDraw}
            onDeleteBlock={onDeleteBlock}
            onToggleDone={onToggleDone}
            onOpenTask={onOpenTask}
          />
        </section>
      </div>

      <DragGhost ghost={drag.ghost} />

      {pendingRange && (
        <NewAppointmentDialog
          range={pendingRange}
          locale={locale}
          t={t}
          onCreate={(title, category, recurring) => {
            onCreateTaskWithBlock(title, category, recurring, pendingRange);
            closeDialog();
          }}
          onCancel={closeDialog}
        />
      )}
    </div>
  );
}
