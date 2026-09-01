import { useEffect, useMemo, useState } from "react";
import Sidebar from "./components/Sidebar";
import SettingsPage from "./components/SettingsPage";
import NotesPage from "./components/NotesPage";
import TaskModal from "./components/TaskModal";
import TodayPage from "./components/TodayPage";
import WeeklyPlanner from "./components/WeeklyPlanner";
import TimeTracker from "./components/TimeTracker";
import type { DraftRange } from "./components/calendar/useCalendarDrag";
import { dictionaries, localeOf } from "./i18n";
import { startOfWeek, todayKey, uid } from "./lib/date";
import { usePersistentState } from "./lib/storage";
import type {
  Absence,
  Block,
  Category,
  Completions,
  NotePage,
  Notes,
  Page,
  Settings,
  Task,
  WorkLog,
} from "./types";

const DEFAULT_SETTINGS: Settings = {
  lang: "de",
  theme: "dark",
  autoBreak: true,
  autoBreakMin: 30,
  autoBreakAfterHours: 6,
  targetHoursPerDay: 8,
};

const DEFAULT_TASKS: Task[] = [
  { id: "seed-reading", title: "Lesen", category: "leisure", recurring: true },
  { id: "seed-training", title: "Training", category: "training", recurring: true },
  { id: "seed-planning", title: "Tagesplanung", category: "other", recurring: true },
];

interface InstallPromptEvent extends Event {
  prompt: () => Promise<void>;
}

const STORAGE_PREFIX = "dailyplanner:";

/** Only these keys are read and written by the backup, so an imported file cannot inject anything else. */
const BACKUP_KEYS = [
  "settings",
  "tasks",
  "blocks",
  "completions",
  "notes",
  "note-pages",
  "logs",
  "study-logs",
  "absences",
  "timer",
  "study-timer",
] as const;

export default function App() {
  const [settings, setSettings] = usePersistentState<Settings>("settings", DEFAULT_SETTINGS);
  const [tasks, setTasks] = usePersistentState<Task[]>("tasks", DEFAULT_TASKS);
  const [blocks, setBlocks] = usePersistentState<Block[]>("blocks", []);
  const [completions, setCompletions] = usePersistentState<Completions>("completions", {});
  const [notes, setNotes] = usePersistentState<Notes>("notes", {});
  const [notePages, setNotePages] = usePersistentState<NotePage[]>("note-pages", []);
  const [logs, setLogs] = usePersistentState<WorkLog[]>("logs", []);
  const [studyLogs, setStudyLogs] = usePersistentState<WorkLog[]>("study-logs", []);
  const [absences, setAbsences] = usePersistentState<Absence[]>("absences", []);

  const [page, setPage] = useState<Page>("today");
  const [editingTaskId, setEditingTaskId] = useState<string | null>(null);
  const [weekStart, setWeekStart] = useState(() => startOfWeek(new Date()));
  const [installEvent, setInstallEvent] = useState<InstallPromptEvent | null>(null);
  const [today, setToday] = useState(() => todayKey());

  const t = dictionaries[settings.lang];
  const locale = localeOf(settings.lang);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", settings.theme === "dark");
    document.documentElement.lang = settings.lang;
  }, [settings.theme, settings.lang]);

  // Completion is tracked per date, so crossing midnight has to refresh the day.
  useEffect(() => {
    const id = window.setInterval(() => setToday(todayKey()), 30_000);
    return () => window.clearInterval(id);
  }, []);

  // Tasks stored before the recurring flag existed are daily tasks.
  useEffect(() => {
    setTasks((prev) =>
      prev.every((task) => typeof task.recurring === "boolean")
        ? prev
        : prev.map((task) => ({ ...task, recurring: task.recurring ?? true }))
    );
  }, [setTasks]);

  useEffect(() => {
    const onPrompt = (e: Event) => {
      e.preventDefault();
      setInstallEvent(e as InstallPromptEvent);
    };
    window.addEventListener("beforeinstallprompt", onPrompt);
    return () => window.removeEventListener("beforeinstallprompt", onPrompt);
  }, []);

  const patchSettings = (patch: Partial<Settings>) => setSettings((prev) => ({ ...prev, ...patch }));

  const toggleDone = (date: string, taskId: string) =>
    setCompletions((prev) => {
      const current = prev[date] ?? [];
      const next = current.includes(taskId)
        ? current.filter((id) => id !== taskId)
        : [...current, taskId];
      return { ...prev, [date]: next };
    });

  const setNote = (date: string, taskId: string, note: string) =>
    setNotes((prev) => ({ ...prev, [date]: { ...(prev[date] ?? {}), [taskId]: note } }));

  const addTask = (title: string) =>
    setTasks((prev) => [
      ...prev,
      { id: uid(), title, category: "other", recurring: false, date: today },
    ]);

  const patchTask = (id: string, patch: Partial<Task>) =>
    setTasks((prev) =>
      prev.map((task) => {
        if (task.id !== id) return task;
        const next = { ...task, ...patch };
        // Turning off recurring must not make the task vanish from the current day.
        if (next.recurring === false && !next.date) next.date = today;
        return next;
      })
    );

  const deleteTask = (id: string) => {
    setTasks((prev) => prev.filter((task) => task.id !== id));
    setBlocks((prev) => prev.filter((block) => block.taskId !== id));
    setEditingTaskId(null);
  };

  const createBlock = (taskId: string, date: string, start: number) =>
    setBlocks((prev) => [...prev, { id: uid(), taskId, date, start, duration: 30 }]);

  const createNotePage = () => {
    const id = uid();
    const now = Date.now();
    setNotePages((prev) => [...prev, { id, title: "", body: "", createdAt: now, updatedAt: now }]);
    return id;
  };

  const patchNotePage = (id: string, patch: Partial<NotePage>) =>
    setNotePages((prev) =>
      prev.map((note) => (note.id === id ? { ...note, ...patch, updatedAt: Date.now() } : note))
    );

  const deleteNotePage = (id: string) =>
    setNotePages((prev) => prev.filter((note) => note.id !== id));

  const updateBlock = (id: string, patch: Partial<Block>) =>
    setBlocks((prev) => prev.map((block) => (block.id === id ? { ...block, ...patch } : block)));

  const deleteBlock = (id: string) => {
    const removed = blocks.find((block) => block.id === id);
    setBlocks((prev) => prev.filter((block) => block.id !== id));
    // A one-off appointment only exists through its block; checklist tasks have their own day.
    if (removed && blocks.filter((block) => block.taskId === removed.taskId).length === 1) {
      setTasks((prev) =>
        prev.filter((task) => task.id !== removed.taskId || task.recurring || Boolean(task.date))
      );
    }
  };

  const createTaskWithBlock = (
    title: string,
    category: Category,
    recurring: boolean,
    range: DraftRange
  ) => {
    const taskId = uid();
    setTasks((prev) => [...prev, { id: taskId, title, category, recurring }]);
    setBlocks((prev) => [
      ...prev,
      { id: uid(), taskId, date: range.date, start: range.start, duration: range.duration },
    ]);
  };

  const checklistTasks = useMemo(() => {
    const scheduled = new Set(
      blocks.filter((block) => block.date === today).map((block) => block.taskId)
    );
    return tasks.filter(
      (task) => task.recurring || scheduled.has(task.id) || task.date === today
    );
  }, [tasks, blocks, today]);

  const editingTask = tasks.find((task) => task.id === editingTaskId) ?? null;

  const clearAll = () => {
    for (const key of Object.keys(localStorage).filter((k) => k.startsWith(STORAGE_PREFIX))) {
      localStorage.removeItem(key);
    }
    window.location.reload();
  };

  const exportData = () => {
    const data: Record<string, unknown> = {};
    for (const key of BACKUP_KEYS) {
      const raw = localStorage.getItem(STORAGE_PREFIX + key);
      if (raw !== null) data[key] = JSON.parse(raw) as unknown;
    }
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a");
    anchor.href = url;
    anchor.download = `dailyplanner-backup-${todayKey()}.json`;
    anchor.click();
    URL.revokeObjectURL(url);
  };

  const importData = async (file: File) => {
    try {
      const parsed: unknown = JSON.parse(await file.text());
      if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) throw new Error("invalid");
      const data = parsed as Record<string, unknown>;
      for (const key of BACKUP_KEYS) {
        if (key in data) localStorage.setItem(STORAGE_PREFIX + key, JSON.stringify(data[key]));
      }
      window.location.reload();
    } catch {
      window.alert(t.settings.importError);
    }
  };

  return (
    <div className="flex min-h-full bg-bg text-fg">
      <Sidebar
        page={page}
        onNavigate={setPage}
        t={t}
        lang={settings.lang}
        onToggleLang={() => patchSettings({ lang: settings.lang === "de" ? "en" : "de" })}
        theme={settings.theme}
        onToggleTheme={() => patchSettings({ theme: settings.theme === "dark" ? "light" : "dark" })}
      />

      <main className="min-w-0 flex-1 p-4 pb-24 md:p-8 md:pb-8">
        {page === "today" && (
          <TodayPage
            today={today}
            checklistTasks={checklistTasks}
            tasks={tasks}
            blocks={blocks}
            completions={completions}
            notes={notes[today] ?? {}}
            locale={locale}
            t={t}
            onAddTask={addTask}
            onToggleDone={toggleDone}
            onOpenTask={setEditingTaskId}
            onCreateBlock={createBlock}
            onCreateTaskWithBlock={createTaskWithBlock}
            onUpdateBlock={updateBlock}
            onDeleteBlock={deleteBlock}
          />
        )}

        {page === "week" && (
          <WeeklyPlanner
            tasks={tasks}
            blocks={blocks}
            completions={completions}
            weekStart={weekStart}
            locale={locale}
            t={t}
            onWeekChange={setWeekStart}
            onCreateTaskWithBlock={createTaskWithBlock}
            onUpdateBlock={updateBlock}
            onDeleteBlock={deleteBlock}
            onToggleDone={toggleDone}
            onOpenTask={setEditingTaskId}
          />
        )}

        {page === "notes" && (
          <NotesPage
            notes={notePages}
            locale={locale}
            t={t}
            onCreate={createNotePage}
            onPatch={patchNotePage}
            onDelete={deleteNotePage}
          />
        )}

        {page === "work" && (
          <TimeTracker
            variant="work"            storageKey="timer"
            title={t.work.title}
            logs={logs}
            absences={absences}
            settings={settings}
            t={t}
            onLogsChange={setLogs}
            onAbsencesChange={setAbsences}
          />
        )}

        {page === "study" && (
          <TimeTracker
            variant="study"
            storageKey="study-timer"
            title={t.study.title}
            subtitle={t.study.subtitle}
            logs={studyLogs}
            absences={[]}
            settings={settings}
            t={t}
            onLogsChange={setStudyLogs}
            onAbsencesChange={() => undefined}
          />
        )}

        {page === "settings" && (
          <SettingsPage
            settings={settings}
            t={t}
            onChange={patchSettings}
            onResetToday={() => setCompletions((prev) => ({ ...prev, [today]: [] }))}
            onClearAll={clearAll}
            onExportData={exportData}
            onImportData={(file) => void importData(file)}
            onInstall={
              installEvent
                ? () => {
                    void installEvent.prompt();
                    setInstallEvent(null);
                  }
                : null
            }
          />
        )}
      </main>

      {editingTask && (
        <TaskModal
          task={editingTask}
          note={notes[today]?.[editingTask.id] ?? ""}
          done={(completions[today] ?? []).includes(editingTask.id)}
          dateLabel={new Date().toLocaleDateString(locale)}
          t={t}
          onPatch={(patch) => patchTask(editingTask.id, patch)}
          onNoteChange={(note) => setNote(today, editingTask.id, note)}
          onToggleDone={() => toggleDone(today, editingTask.id)}
          onDelete={() => deleteTask(editingTask.id)}
          onClose={() => setEditingTaskId(null)}
        />
      )}
    </div>
  );
}
