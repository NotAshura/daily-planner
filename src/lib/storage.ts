import { useEffect, useState } from "react";

const PREFIX = "dailyplanner:";

export function loadState<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (raw === null) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

/** State that is mirrored into localStorage so it survives a restart. */
export function usePersistentState<T>(key: string, fallback: T) {
  const [value, setValue] = useState<T>(() => loadState(key, fallback));

  useEffect(() => {
    try {
      localStorage.setItem(PREFIX + key, JSON.stringify(value));
    } catch {
      // Quota exceeded or storage disabled – keep the app usable anyway.
    }
  }, [key, value]);

  return [value, setValue] as const;
}
