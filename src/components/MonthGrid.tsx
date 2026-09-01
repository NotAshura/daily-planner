import { useMemo } from "react";
import type { Dict } from "../i18n";
import { CATEGORY_BLOCK } from "../lib/categories";
import { dateKey, minToClock, monthGridDays, todayKey } from "../lib/date";
import { expandSchedule } from "../lib/schedule";
import type { Block, Completions, Task } from "../types";

interface MonthGridProps {
  month: Date;
  blocks: Block[];
  tasks: Task[];
  completions: Completions;
  t: Dict;
  onSelectDay: (day: Date) => void;
  onOpenTask: (id: string) => void;
}

const MAX_CHIPS = 3;

export default function MonthGrid({
  month,
  blocks,
  tasks,
  completions,
  t,
  onSelectDay,
  onOpenTask,
}: MonthGridProps) {
  const days = useMemo(() => monthGridDays(month), [month]);
  const today = todayKey();

  const byDay = useMemo(() => {
    const map = new Map<string, Block[]>();
    for (const block of expandSchedule(tasks, blocks, days.map(dateKey))) {
      const list = map.get(block.date);
      if (list) list.push(block);
      else map.set(block.date, [block]);
    }
    for (const list of map.values()) list.sort((a, b) => a.start - b.start);
    return map;
  }, [tasks, blocks, days]);

  return (
    <div className="overflow-hidden rounded-xl border border-line bg-surface">
      <div className="grid grid-cols-7 border-b border-line">
        {t.weekdaysShort.map((day) => (
          <div key={day} className="p-2 text-center text-xs font-semibold text-muted">
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7">
        {days.map((day) => {
          const key = dateKey(day);
          const outside = day.getMonth() !== month.getMonth();
          const dayBlocks = byDay.get(key) ?? [];
          return (
            <button
              key={key}
              onClick={() => onSelectDay(day)}
              className={`flex min-h-24 flex-col gap-1 border-b border-l border-line p-1.5 text-left transition hover:bg-surface-2 ${
                outside ? "bg-surface-2/40 text-muted opacity-60" : ""
              }`}
            >
              <span
                className={`self-start rounded-full px-1.5 text-xs font-semibold ${
                  key === today ? "bg-blue-600 text-white" : ""
                }`}
              >
                {day.getDate()}
              </span>

              {dayBlocks.slice(0, MAX_CHIPS).map((block) => {
                const task = tasks.find((x) => x.id === block.taskId);
                if (!task) return null;
                const done = completions[key]?.includes(task.id) ?? false;
                return (
                  <span
                    key={block.id}
                    role="button"
                    tabIndex={0}
                    onClick={(e) => {
                      e.stopPropagation();
                      onOpenTask(task.id);
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" || e.key === " ") {
                        e.stopPropagation();
                        onOpenTask(task.id);
                      }
                    }}
                    className={`truncate rounded px-1 py-0.5 text-[10px] ${
                      CATEGORY_BLOCK[task.category]
                    } ${done ? "line-through opacity-50" : ""}`}
                  >
                    {minToClock(block.start)} {task.title}
                  </span>
                );
              })}

              {dayBlocks.length > MAX_CHIPS && (
                <span className="text-[10px] text-muted">
                  {t.week.more(dayBlocks.length - MAX_CHIPS)}
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
