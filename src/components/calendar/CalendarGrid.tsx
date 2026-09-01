import { useEffect, useRef } from "react";
import { Check, X } from "lucide-react";
import type { Dict } from "../../i18n";
import { CATEGORY_BLOCK } from "../../lib/categories";
import { dateKey, minToClock, todayKey } from "../../lib/date";
import type { Block, Completions, Task } from "../../types";
import {
  HOUR_HEIGHT,
  PX_PER_MIN,
  START_HOUR,
  END_HOUR,
  TOTAL_MIN,
  type DraftRange,
} from "./useCalendarDrag";

interface CalendarGridProps {
  days: Date[];
  blocks: Block[];
  tasks: Task[];
  completions: Completions;
  draft: DraftRange | null;
  gridRef: React.RefObject<HTMLDivElement | null>;
  t: Dict;
  /** Scrolls the current hour into view on mount – used by the single day calendar. */
  scrollToNow?: boolean;
  className?: string;
  onStartMove: (e: React.PointerEvent, block: Block) => void;
  onStartResize: (block: Block) => void;
  onStartDraw: (e: React.PointerEvent, date: string) => void;
  onDeleteBlock: (id: string) => void;
  onToggleDone: (date: string, taskId: string) => void;
  onOpenTask: (id: string) => void;
}

const hours = Array.from({ length: END_HOUR - START_HOUR + 1 }, (_, i) => START_HOUR + i);

export default function CalendarGrid({
  days,
  blocks,
  tasks,
  completions,
  draft,
  gridRef,
  t,
  scrollToNow = false,
  className = "",
  onStartMove,
  onStartResize,
  onStartDraw,
  onDeleteBlock,
  onToggleDone,
  onOpenTask,
}: CalendarGridProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const today = todayKey();

  useEffect(() => {
    if (!scrollToNow || !scrollRef.current) return;
    const now = new Date();
    const minutes = now.getHours() * 60 + now.getMinutes();
    scrollRef.current.scrollTop = Math.max(0, (minutes - START_HOUR * 60 - 60) * PX_PER_MIN);
  }, [scrollToNow]);

  const nowMinutes = new Date().getHours() * 60 + new Date().getMinutes();
  const showNowLine = nowMinutes >= START_HOUR * 60 && nowMinutes <= END_HOUR * 60;

  return (
    <div ref={scrollRef} className={`overflow-auto select-none ${className}`}>
      <div className={days.length > 1 ? "min-w-[680px]" : ""}>
        {days.length > 1 && (
          <div className="flex">
            <div className="w-12 shrink-0" />
            <div className="flex flex-1">
              {days.map((day) => {
                const key = dateKey(day);
                return (
                  <div
                    key={key}
                    className={`flex-1 pb-2 text-center text-xs font-semibold ${
                      key === today ? "text-blue-500" : ""
                    }`}
                  >
                    <div>{t.weekdaysShort[(day.getDay() + 6) % 7]}</div>
                    <div className="text-[11px] font-normal text-muted">{day.getDate()}.</div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex">
          <div className="relative w-12 shrink-0" style={{ height: TOTAL_MIN * PX_PER_MIN }}>
            {hours.map((h) => (
              <div
                key={h}
                className="absolute right-1 -translate-y-1/2 text-[10px] text-muted"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
              >
                {String(h).padStart(2, "0")}:00
              </div>
            ))}
          </div>

          <div
            ref={gridRef}
            className="relative flex flex-1 border-t border-line"
            style={{ height: TOTAL_MIN * PX_PER_MIN }}
          >
            {hours.slice(1).map((h) => (
              <div
                key={h}
                className="pointer-events-none absolute inset-x-0 border-t border-line/60"
                style={{ top: (h - START_HOUR) * HOUR_HEIGHT }}
              />
            ))}

            {days.map((day) => {
              const key = dateKey(day);
              return (
                <div
                  key={key}
                  onPointerDown={(e) => {
                    if (e.target === e.currentTarget) onStartDraw(e, key);
                  }}
                  className={`relative h-full flex-1 touch-none border-l border-line ${
                    key === today ? "bg-blue-500/5" : ""
                  }`}
                >
                  {key === today && showNowLine && (
                    <div
                      className="pointer-events-none absolute inset-x-0 z-10 border-t-2 border-red-500"
                      style={{ top: (nowMinutes - START_HOUR * 60) * PX_PER_MIN }}
                    />
                  )}

                  {draft?.date === key && (
                    <div
                      className="pointer-events-none absolute inset-x-0.5 rounded-md border-2 border-dashed border-blue-400 bg-blue-500/20"
                      style={{
                        top: (draft.start - START_HOUR * 60) * PX_PER_MIN,
                        height: draft.duration * PX_PER_MIN,
                      }}
                    />
                  )}

                  {blocks
                    .filter((block) => block.date === key)
                    .map((block) => {
                      const task = tasks.find((x) => x.id === block.taskId);
                      if (!task) return null;
                      const done = completions[key]?.includes(task.id) ?? false;
                      return (
                        <div
                          key={block.id}
                          onPointerDown={(e) => onStartMove(e, block)}
                          onDoubleClick={() => onOpenTask(task.id)}
                          className={`absolute inset-x-0.5 touch-none overflow-hidden rounded-md border px-1.5 py-1 text-[11px] shadow-sm ${
                            CATEGORY_BLOCK[task.category]
                          } ${done ? "opacity-40" : ""}`}
                          style={{
                            top: (block.start - START_HOUR * 60) * PX_PER_MIN,
                            height: block.duration * PX_PER_MIN,
                          }}
                        >
                          <div className="flex items-start gap-1">
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => onToggleDone(key, task.id)}
                              className="shrink-0 rounded hover:bg-white/20"
                              aria-pressed={done}
                              aria-label={t.taskModal.doneToday}
                            >
                              <Check size={12} />
                            </button>
                            <span
                              className={`min-w-0 flex-1 truncate font-medium ${
                                done ? "line-through" : ""
                              }`}
                            >
                              {task.title}
                            </span>
                            <button
                              onPointerDown={(e) => e.stopPropagation()}
                              onClick={() => onDeleteBlock(block.id)}
                              className="shrink-0 rounded hover:bg-white/20"
                              aria-label={t.common.delete}
                            >
                              <X size={12} />
                            </button>
                          </div>
                          {block.duration >= 30 && (
                            <div className="opacity-80">
                              {minToClock(block.start)}–{minToClock(block.start + block.duration)}
                            </div>
                          )}
                          <div
                            onPointerDown={(e) => {
                              e.stopPropagation();
                              onStartResize(block);
                            }}
                            className="absolute inset-x-0 bottom-0 h-2 cursor-ns-resize touch-none bg-white/25"
                          />
                        </div>
                      );
                    })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
