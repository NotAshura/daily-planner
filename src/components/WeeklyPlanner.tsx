import { useMemo, useState } from "react";
import { CalendarRange, ChevronLeft, ChevronRight } from "lucide-react";
import type { Dict } from "../i18n";
import {
  addDays,
  addMonths,
  dateKey,
  isoWeekNumber,
  startOfMonth,
  startOfWeek,
} from "../lib/date";
import type { Block, Category, Completions, Task } from "../types";
import CalendarGrid from "./calendar/CalendarGrid";
import DragGhost from "./calendar/DragGhost";
import { useCalendarDrag, type DraftRange } from "./calendar/useCalendarDrag";
import MonthGrid from "./MonthGrid";
import NewAppointmentDialog from "./NewAppointmentDialog";
import YearGrid from "./YearGrid";

type View = "week" | "month" | "year";

const VIEWS: View[] = ["week", "month", "year"];

interface WeeklyPlannerProps {
  tasks: Task[];
  blocks: Block[];
  completions: Completions;
  weekStart: Date;
  locale: string;
  t: Dict;
  onWeekChange: (start: Date) => void;
  onCreateTaskWithBlock: (
    title: string,
    category: Category,
    recurring: boolean,
    range: DraftRange
  ) => void;
  onUpdateBlock: (id: string, patch: Partial<Block>) => void;
  onDeleteBlock: (id: string) => void;
  onToggleDone: (date: string, taskId: string) => void;
  onOpenTask: (id: string) => void;
}

export default function WeeklyPlanner({
  tasks,
  blocks,
  completions,
  weekStart,
  locale,
  t,
  onWeekChange,
  onCreateTaskWithBlock,
  onUpdateBlock,
  onDeleteBlock,
  onToggleDone,
  onOpenTask,
}: WeeklyPlannerProps) {
  const [pendingRange, setPendingRange] = useState<DraftRange | null>(null);
  const [view, setView] = useState<View>("week");
  // Month and year views browse independently of the week the calendar is showing.
  const [cursor, setCursor] = useState(() => startOfMonth(addDays(weekStart, 3)));

  const days = useMemo(
    () => Array.from({ length: 7 }, (_, i) => addDays(weekStart, i)),
    [weekStart]
  );
  const dayKeys = useMemo(() => days.map(dateKey), [days]);

  const drag = useCalendarDrag({
    days: dayKeys,
    blocks,
    onCreateBlock: () => undefined,
    onUpdateBlock,
    onDraw: setPendingRange,
  });

  const closeDialog = () => {
    setPendingRange(null);
    drag.clearDraft();
  };

  const weekLabel = `${t.week.calendarWeek(isoWeekNumber(weekStart))} · ${weekStart.toLocaleDateString(
    locale
  )} – ${addDays(weekStart, 6).toLocaleDateString(locale)}`;

  const label =
    view === "week"
      ? weekLabel
      : view === "month"
        ? cursor.toLocaleDateString(locale, { month: "long", year: "numeric" })
        : String(cursor.getFullYear());

  const hint = view === "week" ? t.week.hint : view === "month" ? t.week.monthHint : t.week.yearHint;

  const changeView = (next: View) => {
    if (next !== "week") setCursor(startOfMonth(addDays(weekStart, 3)));
    setView(next);
  };

  const step = (direction: -1 | 1) => {
    if (view === "week") onWeekChange(addDays(weekStart, direction * 7));
    else setCursor((prev) => addMonths(prev, direction * (view === "month" ? 1 : 12)));
  };

  const goToToday = () => {
    const now = new Date();
    onWeekChange(startOfWeek(now));
    setCursor(startOfMonth(now));
  };

  const openWeekOf = (day: Date) => {
    onWeekChange(startOfWeek(day));
    setView("week");
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <h2 className="text-2xl font-bold">{t.week.title}</h2>

        <div className="flex rounded-lg border border-line p-0.5">
          {VIEWS.map((id) => (
            <button
              key={id}
              onClick={() => changeView(id)}
              aria-pressed={view === id}
              className={`rounded-md px-3 py-1.5 text-sm transition ${
                view === id ? "bg-surface-2 font-semibold" : "text-muted hover:bg-surface-2"
              }`}
            >
              {t.week.views[id]}
            </button>
          ))}
        </div>

        <div className="ml-auto flex items-center gap-1">
          <button
            onClick={() => step(-1)}
            aria-label={t.week.prev}
            className="rounded-lg border border-line p-2 hover:bg-surface-2"
          >
            <ChevronLeft size={16} />
          </button>
          <button
            onClick={goToToday}
            className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface-2"
          >
            <CalendarRange size={16} /> {t.week.current}
          </button>
          <button
            onClick={() => step(1)}
            aria-label={t.week.next}
            className="rounded-lg border border-line p-2 hover:bg-surface-2"
          >
            <ChevronRight size={16} />
          </button>
        </div>
      </div>

      <div className="flex flex-wrap items-baseline gap-x-4 gap-y-1">
        <p className="text-sm text-muted">{label}</p>
        <p className="text-xs text-muted">{hint}</p>
      </div>

      {view === "week" && (
        <CalendarGrid
          days={days}
          blocks={blocks}
          tasks={tasks}
          completions={completions}
          draft={drag.draft}
          gridRef={drag.gridRef}
          t={t}
          className="rounded-xl border border-line bg-surface p-3"
          onStartMove={drag.startMove}
          onStartResize={drag.startResize}
          onStartDraw={drag.startDraw}
          onDeleteBlock={onDeleteBlock}
          onToggleDone={onToggleDone}
          onOpenTask={onOpenTask}
        />
      )}

      {view === "month" && (
        <MonthGrid
          month={cursor}
          blocks={blocks}
          tasks={tasks}
          completions={completions}
          t={t}
          onSelectDay={openWeekOf}
          onOpenTask={onOpenTask}
        />
      )}

      {view === "year" && (
        <YearGrid
          year={cursor.getFullYear()}
          blocks={blocks}
          locale={locale}
          t={t}
          onSelectMonth={(month) => {
            setCursor(month);
            setView("month");
          }}
          onSelectDay={openWeekOf}
        />
      )}

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
