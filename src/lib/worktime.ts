import { clockToMin } from "./date";
import type { WorkLog } from "../types";

/** Net worked minutes of a record, tolerating shifts that pass midnight. */
export function netMinutes(log: WorkLog): number {
  const start = clockToMin(log.start);
  const end = clockToMin(log.end);
  const gross = end >= start ? end - start : end + 24 * 60 - start;
  return Math.max(0, gross - Math.max(0, log.breakMin));
}
