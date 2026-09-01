import { parseKey, weekdayIndex } from "./date";
import type { Block, Task } from "../types";

/** Blocks generated from a task's repeating schedule carry this id prefix. */
export const SLOT_PREFIX = "slot:";

export const slotBlockId = (taskId: string, index: number, date: string) =>
  `${SLOT_PREFIX}${taskId}:${index}:${date}`;

export function parseSlotBlockId(id: string): { taskId: string; index: number } | null {
  if (!id.startsWith(SLOT_PREFIX)) return null;
  const [taskId, index] = id.slice(SLOT_PREFIX.length).split(":");
  return { taskId, index: Number(index) };
}

/** Whether a recurring task runs on the given day; no selection means every day. */
export function runsOn(task: Task, date: string): boolean {
  if (!task.weekdays?.length) return true;
  return task.weekdays.includes(weekdayIndex(parseKey(date)));
}

/** Real blocks of the given days plus the repeating slots of every recurring task. */
export function expandSchedule(tasks: Task[], blocks: Block[], dates: string[]): Block[] {
  const days = new Set(dates);
  const result = blocks.filter((block) => days.has(block.date));

  for (const task of tasks) {
    if (!task.recurring || !task.schedule?.length) continue;
    for (const date of dates) {
      if (!runsOn(task, date)) continue;
      task.schedule.forEach((slot, index) => {
        result.push({
          id: slotBlockId(task.id, index, date),
          taskId: task.id,
          date,
          start: slot.start,
          duration: slot.duration,
        });
      });
    }
  }

  return result;
}
