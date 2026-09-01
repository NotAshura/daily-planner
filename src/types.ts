export type Category = "work" | "training" | "learning" | "leisure" | "other";

export type Lang = "de" | "en";
export type Theme = "dark" | "light";
/** Separate data sets: work has the worktime tracker, private the study tracker. */
export type Workspace = "work" | "private";
export type Page = "today" | "week" | "notes" | "work" | "study" | "settings";

/** A repeating time of day for a recurring task, in minutes since midnight. */
export interface TaskSlot {
  start: number;
  duration: number;
}

/** A checklist item. Recurring tasks show up every day, one-off tasks only on days they are scheduled. */
export interface Task {
  id: string;
  title: string;
  category: Category;
  recurring: boolean;
  /** Day a one-off task belongs to, even without a time block. Ignored for recurring tasks. */
  date?: string; // yyyy-mm-dd
  /** Manual position in the checklist; lower comes first. */
  order?: number;
  /** Times that repeat on every day, only used by recurring tasks. */
  schedule?: TaskSlot[];
}

/** A time block in the calendar. It has no own title/colour – both come from the task. */
export interface Block {
  id: string;
  taskId: string;
  date: string; // yyyy-mm-dd
  start: number; // minutes since 00:00
  duration: number; // minutes
}

export interface WorkLog {
  id: string;
  date: string; // yyyy-mm-dd
  start: string; // HH:MM
  end: string; // HH:MM
  breakMin: number;
}

export type AbsenceType = "vacation" | "sick";

export interface Absence {
  id: string;
  date: string; // yyyy-mm-dd
  type: AbsenceType;
}

export interface Settings {
  lang: Lang;
  theme: Theme;
  workspace: Workspace;
  autoBreak: boolean;
  autoBreakMin: number;
  autoBreakAfterHours: number;
  targetHoursPerDay: number;
}

export type TimerState =
  | { mode: "stopped" }
  | {
      mode: "running" | "paused";
      date: string;
      firstStart: string; // HH:MM
      accumulatedSec: number;
      startedAt: number; // epoch ms of the current running segment
      manualBreakSec: number;
    };

/** A free-form Markdown note. Independent of any day or date. */
export interface NotePage {
  id: string;
  title: string;
  body: string;
  createdAt: number; // epoch ms
  updatedAt: number; // epoch ms
}

/** completions[dateKey] = list of task ids done on that day */
export type Completions = Record<string, string[]>;

/** notes[dateKey][taskId] = note text for that task on that day */
export type Notes = Record<string, Record<string, string>>;
