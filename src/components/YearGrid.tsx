import { useMemo } from "react";
import type { Dict } from "../i18n";
import { dateKey, monthGridDays, todayKey } from "../lib/date";
import type { Block } from "../types";

interface YearGridProps {
  year: number;
  blocks: Block[];
  locale: string;
  t: Dict;
  onSelectMonth: (month: Date) => void;
  onSelectDay: (day: Date) => void;
}

export default function YearGrid({
  year,
  blocks,
  locale,
  t,
  onSelectMonth,
  onSelectDay,
}: YearGridProps) {
  const today = todayKey();
  const busy = useMemo(() => new Set(blocks.map((block) => block.date)), [blocks]);
  const months = useMemo(
    () => Array.from({ length: 12 }, (_, i) => new Date(year, i, 1)),
    [year]
  );

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
      {months.map((month) => (
        <section key={month.getMonth()} className="rounded-xl border border-line bg-surface p-3">
          <button
            onClick={() => onSelectMonth(month)}
            className="mb-2 w-full rounded px-1 text-left text-sm font-semibold hover:bg-surface-2"
          >
            {month.toLocaleDateString(locale, { month: "long" })}
          </button>

          <div className="grid grid-cols-7 gap-0.5 text-center">
            {t.weekdaysShort.map((day) => (
              <span key={day} className="text-[10px] text-muted">
                {day.slice(0, 1)}
              </span>
            ))}

            {monthGridDays(month).map((day) => {
              const key = dateKey(day);
              const outside = day.getMonth() !== month.getMonth();
              return (
                <button
                  key={key}
                  onClick={() => onSelectDay(day)}
                  className={`relative rounded py-0.5 text-[11px] hover:bg-surface-2 ${
                    outside ? "text-muted opacity-40" : ""
                  } ${key === today ? "bg-blue-600 font-semibold text-white hover:bg-blue-600" : ""}`}
                >
                  {day.getDate()}
                  {!outside && busy.has(key) && (
                    <span
                      className={`absolute inset-x-0 bottom-0 mx-auto h-1 w-1 rounded-full ${
                        key === today ? "bg-white" : "bg-blue-500"
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>
        </section>
      ))}
    </div>
  );
}
