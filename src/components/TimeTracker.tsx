import { useEffect, useMemo, useState } from "react";
import { Clock, Coffee, Download, Pause, Play, Plus, Square, Trash2 } from "lucide-react";
import type { Dict } from "../i18n";
import { downloadWorkbook, type Sheet } from "../lib/excel";
import {
  dateKey,
  formatHours,
  inWeekOf,
  minToClock,
  nowClock,
  sameMonth,
  sameYear,
  secToClock,
  todayKey,
  uid,
} from "../lib/date";
import { usePersistentState } from "../lib/storage";
import { netMinutes } from "../lib/worktime";
import type { Absence, AbsenceType, Settings, TimerState, WorkLog } from "../types";

interface TimeTrackerProps {
  /** "work" applies the automatic lunch break and tracks absences, "study" does neither. */
  variant: "work" | "study";
  storageKey: string;
  title: string;
  subtitle?: string;
  logs: WorkLog[];
  absences: Absence[];
  settings: Settings;
  t: Dict;
  onLogsChange: (updater: (logs: WorkLog[]) => WorkLog[]) => void;
  onAbsencesChange: (updater: (absences: Absence[]) => Absence[]) => void;
}

export default function TimeTracker({
  variant,
  storageKey,
  title,
  subtitle,
  logs,
  absences,
  settings,
  t,
  onLogsChange,
  onAbsencesChange,
}: TimeTrackerProps) {
  const isWork = variant === "work";
  const [timer, setTimer] = usePersistentState<TimerState>(storageKey, { mode: "stopped" });
  const [now, setNow] = useState(() => Date.now());
  const [absenceDraft, setAbsenceDraft] = useState<{ date: string; type: AbsenceType }>(() => ({
    date: todayKey(),
    type: "vacation",
  }));

  useEffect(() => {
    if (timer.mode === "stopped") return;
    const id = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(id);
  }, [timer.mode]);

  const runningSegmentSec = timer.mode === "stopped" ? 0 : (now - timer.startedAt) / 1000;
  const trackedSec =
    timer.mode === "running"
      ? timer.accumulatedSec + runningSegmentSec
      : timer.mode === "paused"
        ? timer.accumulatedSec
        : 0;
  const breakSec =
    timer.mode === "paused"
      ? timer.manualBreakSec + runningSegmentSec
      : timer.mode === "running"
        ? timer.manualBreakSec
        : 0;

  const start = () =>
    setTimer((prev) =>
      prev.mode === "stopped"
        ? {
            mode: "running",
            date: todayKey(),
            firstStart: nowClock(),
            accumulatedSec: 0,
            startedAt: Date.now(),
            manualBreakSec: 0,
          }
        : {
            ...prev,
            mode: "running",
            manualBreakSec: prev.manualBreakSec + (Date.now() - prev.startedAt) / 1000,
            startedAt: Date.now(),
          }
    );

  const pause = () =>
    setTimer((prev) =>
      prev.mode === "running"
        ? {
            ...prev,
            mode: "paused",
            accumulatedSec: prev.accumulatedSec + (Date.now() - prev.startedAt) / 1000,
            startedAt: Date.now(),
          }
        : prev
    );

  const stop = () => {
    if (timer.mode === "stopped") return;
    const trackedMin =
      (timer.mode === "running"
        ? timer.accumulatedSec + (Date.now() - timer.startedAt) / 1000
        : timer.accumulatedSec) / 60;
    const manualBreakMin =
      (timer.mode === "paused"
        ? timer.manualBreakSec + (Date.now() - timer.startedAt) / 1000
        : timer.manualBreakSec) / 60;

    let breakMin = Math.round(manualBreakMin);
    if (isWork && settings.autoBreak && trackedMin >= settings.autoBreakAfterHours * 60) {
      breakMin = Math.max(breakMin, settings.autoBreakMin);
    }

    const log: WorkLog = {
      id: uid(),
      date: timer.date,
      start: timer.firstStart,
      end: nowClock(),
      breakMin,
    };
    onLogsChange((prev) => [...prev, log].sort((a, b) => a.date.localeCompare(b.date)));
    setTimer({ mode: "stopped" });
  };

  const addManualLog = () =>
    onLogsChange((prev) =>
      [
        ...prev,
        isWork
          ? { id: uid(), date: todayKey(), start: "08:00", end: "16:30", breakMin: 30 }
          : { id: uid(), date: todayKey(), start: "18:00", end: "19:00", breakMin: 0 },
      ].sort((a, b) => a.date.localeCompare(b.date))
    );

  const updateLog = (id: string, patch: Partial<WorkLog>) =>
    onLogsChange((prev) => prev.map((log) => (log.id === id ? { ...log, ...patch } : log)));

  const addAbsence = () => {
    if (!absenceDraft.date) return;
    onAbsencesChange((prev) =>
      [...prev.filter((a) => a.date !== absenceDraft.date), { id: uid(), ...absenceDraft }].sort((a, b) =>
        a.date.localeCompare(b.date)
      )
    );
  };

  const stats = useMemo(() => {
    const reference = new Date();
    const sum = (predicate: (log: WorkLog) => boolean) =>
      logs.filter(predicate).reduce((total, log) => total + netMinutes(log), 0);
    return {
      day: sum((log) => log.date === dateKey(reference)),
      week: sum((log) => inWeekOf(log.date, reference)),
      month: sum((log) => sameMonth(log.date, reference)),
      vacation: absences.filter((a) => a.type === "vacation" && sameYear(a.date, reference)).length,
      sick: absences.filter((a) => a.type === "sick" && sameYear(a.date, reference)).length,
    };
  }, [logs, absences]);

  const totalMinutes = logs.reduce((total, log) => total + netMinutes(log), 0);

  const exportExcel = () => {
    const byMonth = new Map<string, { minutes: number; days: Set<string> }>();
    for (const log of logs) {
      const month = log.date.slice(0, 7);
      const entry = byMonth.get(month) ?? { minutes: 0, days: new Set<string>() };
      entry.minutes += netMinutes(log);
      entry.days.add(log.date);
      byMonth.set(month, entry);
    }

    const summaryRows: (string | number)[][] = [
      [t.work.exportMonth, t.work.exportWorkdays, `${t.common.hours} (h)`],
      ...[...byMonth.entries()]
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([month, entry]) => [month, entry.days.size, Number((entry.minutes / 60).toFixed(2))]),
    ];
    if (isWork) {
      summaryRows.push([t.work.vacationDays, stats.vacation, ""], [t.work.sickDays, stats.sick, ""]);
    }

    const sheets: Sheet[] = [
      {
        name: t.work.exportSheetTimes,
        rows: [
          [t.common.date, t.work.from, t.work.to, t.work.breakMin, `${t.work.net} (h)`],
          ...logs.map((log) => [
            log.date,
            log.start,
            log.end,
            log.breakMin,
            Number((netMinutes(log) / 60).toFixed(2)),
          ]),
          ["", "", "", t.common.total, Number((totalMinutes / 60).toFixed(2))],
        ],
      },
    ];
    if (isWork) {
      sheets.push({
        name: t.work.exportSheetAbsences,
        rows: [
          [t.common.date, t.common.type],
          ...absences.map((absence) => [absence.date, t.work[absence.type]]),
        ],
      });
    }
    sheets.push({ name: t.work.exportSheetSummary, rows: summaryRows });

    downloadWorkbook(sheets, `${isWork ? "worktime" : "studytime"}-${todayKey()}.xls`);
  };

  const statCards = [
    {
      label: t.work.statsDay,
      value: formatHours(stats.day),
      hint: isWork ? `${t.settings.targetHours}: ${minToClock(settings.targetHoursPerDay * 60)}` : "",
    },
    { label: t.work.statsWeek, value: formatHours(stats.week), hint: "" },
    { label: t.work.statsMonth, value: formatHours(stats.month), hint: "" },
    ...(isWork
      ? [
          { label: t.work.vacationDays, value: String(stats.vacation), hint: t.work.thisYear },
          { label: t.work.sickDays, value: String(stats.sick), hint: t.work.thisYear },
        ]
      : []),
  ];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">{title}</h2>
        {subtitle && <p className="text-sm text-muted">{subtitle}</p>}
      </div>

      <section className="rounded-xl border border-line bg-surface p-6 text-center">
        <div className="mb-2 flex items-center justify-center gap-2 text-sm text-muted">
          <Clock size={16} /> {t.work.timer}
        </div>
        <div className="font-mono text-4xl tracking-wider sm:text-5xl">{secToClock(trackedSec)}</div>
        <div className="mt-2 text-sm text-muted">
          {timer.mode === "running" ? t.work.running : timer.mode === "paused" ? t.work.paused : t.work.ready}
          {timer.mode !== "stopped" && ` · ${t.work.startedAt(timer.firstStart)}`}
        </div>
        {timer.mode !== "stopped" && breakSec > 0 && (
          <div className="mt-1 flex items-center justify-center gap-1 text-xs text-muted">
            <Coffee size={12} /> {t.work.breakSoFar}: {secToClock(breakSec)}
          </div>
        )}

        <div className="mt-5 flex flex-wrap justify-center gap-2">
          {timer.mode !== "running" && (
            <button
              onClick={start}
              className="flex items-center gap-2 rounded-lg bg-emerald-600 px-5 py-2 text-white hover:bg-emerald-700"
            >
              <Play size={16} /> {timer.mode === "paused" ? t.work.resume : t.work.start}
            </button>
          )}
          {timer.mode === "running" && (
            <button
              onClick={pause}
              className="flex items-center gap-2 rounded-lg bg-amber-600 px-5 py-2 text-white hover:bg-amber-700"
            >
              <Pause size={16} /> {t.work.pause}
            </button>
          )}
          {timer.mode !== "stopped" && (
            <button
              onClick={stop}
              className="flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-white hover:bg-red-700"
            >
              <Square size={16} /> {t.work.stop}
            </button>
          )}
        </div>

        {isWork && settings.autoBreak && (
          <p className="mt-4 text-xs text-muted">
            {t.work.autoBreakNote(settings.autoBreakMin, settings.autoBreakAfterHours)}
          </p>
        )}
        {!isWork && <p className="mt-4 text-xs text-muted">{t.study.noAutoBreak}</p>}
      </section>

      <section className={`grid grid-cols-2 gap-3 ${isWork ? "lg:grid-cols-5" : "lg:grid-cols-3"}`}>
        {statCards.map((card) => (
          <div key={card.label} className="rounded-xl border border-line bg-surface p-4">
            <div className="text-xs text-muted">{card.label}</div>
            <div className="mt-1 font-mono text-xl">{card.value}</div>
            {card.hint && <div className="mt-1 text-[11px] text-muted">{card.hint}</div>}
          </div>
        ))}
      </section>

      <section className="rounded-xl border border-line bg-surface p-5">
        <div className="mb-4 flex flex-wrap items-center gap-2">
          <h3 className="text-lg font-semibold">{t.work.records}</h3>
          <div className="ml-auto flex gap-2">
            <button
              onClick={addManualLog}
              className="flex items-center gap-2 rounded-lg border border-line px-3 py-2 text-sm hover:bg-surface-2"
            >
              <Plus size={16} /> {t.work.addEntry}
            </button>
            <button
              onClick={exportExcel}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              <Download size={16} /> {t.work.export}
            </button>
          </div>
        </div>

        {logs.length === 0 ? (
          <p className="text-sm text-muted">{t.work.noLogs}</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="text-left text-muted">
                <tr>
                  <th className="p-2 font-medium">{t.common.date}</th>
                  <th className="p-2 font-medium">{t.work.from}</th>
                  <th className="p-2 font-medium">{t.work.to}</th>
                  <th className="p-2 font-medium">{t.work.breakMin}</th>
                  <th className="p-2 font-medium">{t.work.net}</th>
                  <th />
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-t border-line">
                    <td className="p-1">
                      <input
                        type="date"
                        value={log.date}
                        onChange={(e) => updateLog(log.id, { date: e.target.value })}
                        className="rounded border border-line bg-surface-2 p-1"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="time"
                        value={log.start}
                        onChange={(e) => updateLog(log.id, { start: e.target.value })}
                        className="rounded border border-line bg-surface-2 p-1"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="time"
                        value={log.end}
                        onChange={(e) => updateLog(log.id, { end: e.target.value })}
                        className="rounded border border-line bg-surface-2 p-1"
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        min={0}
                        step={5}
                        value={log.breakMin}
                        onChange={(e) => updateLog(log.id, { breakMin: Math.max(0, Number(e.target.value)) })}
                        className="w-20 rounded border border-line bg-surface-2 p-1"
                      />
                    </td>
                    <td className="p-2 font-mono">{formatHours(netMinutes(log))}</td>
                    <td className="p-1 text-right">
                      <button
                        onClick={() => onLogsChange((prev) => prev.filter((x) => x.id !== log.id))}
                        aria-label={t.common.delete}
                        className="rounded p-1 text-red-500 hover:bg-red-500/10"
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
                <tr className="border-t-2 border-line font-semibold">
                  <td className="p-2" colSpan={4}>
                    {t.common.total}
                  </td>
                  <td className="p-2 font-mono">{formatHours(totalMinutes)}</td>
                  <td />
                </tr>
              </tbody>
            </table>
          </div>
        )}
      </section>

      {isWork && (
        <section className="rounded-xl border border-line bg-surface p-5">
          <h3 className="mb-4 text-lg font-semibold">{t.work.absences}</h3>

          <div className="mb-4 flex flex-wrap items-end gap-2">
            <label className="text-sm">
              <span className="block text-xs text-muted">{t.common.date}</span>
              <input
                type="date"
                value={absenceDraft.date}
                onChange={(e) => setAbsenceDraft((prev) => ({ ...prev, date: e.target.value }))}
                className="mt-1 rounded border border-line bg-surface-2 p-2"
              />
            </label>
            <label className="text-sm">
              <span className="block text-xs text-muted">{t.common.type}</span>
              <select
                value={absenceDraft.type}
                onChange={(e) => setAbsenceDraft((prev) => ({ ...prev, type: e.target.value as AbsenceType }))}
                className="mt-1 rounded border border-line bg-surface-2 p-2"
              >
                <option value="vacation">{t.work.vacation}</option>
                <option value="sick">{t.work.sick}</option>
              </select>
            </label>
            <button
              onClick={addAbsence}
              className="flex items-center gap-2 rounded-lg bg-blue-600 px-3 py-2 text-sm text-white hover:bg-blue-700"
            >
              <Plus size={16} /> {t.work.addAbsence}
            </button>
          </div>

          {absences.length === 0 ? (
            <p className="text-sm text-muted">{t.work.noAbsences}</p>
          ) : (
            <ul className="flex flex-wrap gap-2">
              {absences.map((absence) => (
                <li
                  key={absence.id}
                  className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm ${
                    absence.type === "vacation"
                      ? "border-sky-500/40 bg-sky-500/10"
                      : "border-rose-500/40 bg-rose-500/10"
                  }`}
                >
                  <span>{absence.date}</span>
                  <span className="text-xs text-muted">{t.work[absence.type]}</span>
                  <button
                    onClick={() => onAbsencesChange((prev) => prev.filter((x) => x.id !== absence.id))}
                    aria-label={t.common.delete}
                    className="text-red-500"
                  >
                    <Trash2 size={14} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
