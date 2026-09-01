import { useEffect, useRef, useState } from "react";

const PREFIX = "dailyplanner:";

/** Data that exists separately per workspace, stored as `dailyplanner:<workspace>:<key>`. */
const WORKSPACE_KEYS = ["tasks", "blocks", "completions", "notes", "note-pages"] as const;

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** Entries written before workspaces existed belong to the work workspace. */
export function migrateToWorkspaces() {
  try {
    for (const key of WORKSPACE_KEYS) {
      const legacy = localStorage.getItem(PREFIX + key);
      if (legacy === null) continue;
      if (localStorage.getItem(`${PREFIX}work:${key}`) === null) {
        localStorage.setItem(`${PREFIX}work:${key}`, legacy);
      }
      localStorage.removeItem(PREFIX + key);
    }
  } catch {
    // Storage disabled – the app still works, just without persistence.
  }
}

/** State that is mirrored into localStorage so it survives a restart. */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => loadState(key, fallback));
  const previous = useRef({ key, fallback });

  useEffect(() => {
    // A workspace switch changes the key: load that data instead of overwriting it.
    if (previous.current.key !== key) {
      previous.current = { key, fallback: previous.current.fallback };
      setValue(loadState(key, previous.current.fallback));
      return;
    }
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled – keep the app usable anyway.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
