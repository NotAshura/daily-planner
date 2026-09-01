import { useEffect, useRef, useState } from "react";
import { X } from "lucide-react";
import type { Dict } from "../i18n";
import { CATEGORIES, CATEGORY_DOT } from "../lib/categories";
import { minToClock, parseKey } from "../lib/date";
import type { Category } from "../types";
import type { DraftRange } from "./calendar/useCalendarDrag";

interface NewAppointmentDialogProps {
  range: DraftRange;
  locale: string;
  t: Dict;
  onCreate: (title: string, category: Category, recurring: boolean) => void;
  onCancel: () => void;
}

export default function NewAppointmentDialog({
  range,
  locale,
  t,
  onCreate,
  onCancel,
}: NewAppointmentDialogProps) {
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<Category>("other");
  const [recurring, setRecurring] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onCancel]);

  const submit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onCreate(trimmed, category, recurring);
  };

  const when = `${parseKey(range.date).toLocaleDateString(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
  })}, ${minToClock(range.start)}–${minToClock(range.start + range.duration)}`;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={t.appointment.title}
      onClick={onCancel}
    >
      <div
        className="w-full max-w-md space-y-4 rounded-xl border border-line bg-surface p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">{t.appointment.title}</h3>
          <button onClick={onCancel} aria-label={t.common.close} className="rounded p-1 hover:bg-surface-2">
            <X size={20} />
          </button>
        </div>

        <p className="text-sm text-muted">{when}</p>

        <label className="block">
          <span className="text-sm text-muted">{t.taskModal.titleLabel}</span>
          <input
            ref={inputRef}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && submit()}
            placeholder={t.appointment.placeholder}
            className="mt-1 w-full rounded-lg border border-line bg-surface-2 p-2 outline-none focus:border-blue-500"
          />
        </label>

        <label className="block">
          <span className="text-sm text-muted">{t.taskModal.categoryLabel}</span>
          <div className="mt-1 flex items-center gap-2">
            <span className={`h-3 w-3 shrink-0 rounded-full ${CATEGORY_DOT[category]}`} />
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full rounded-lg border border-line bg-surface-2 p-2 outline-none focus:border-blue-500"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {t.categories[c]}
                </option>
              ))}
            </select>
          </div>
        </label>

        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            checked={recurring}
            onChange={(e) => setRecurring(e.target.checked)}
            className="mt-0.5 h-4 w-4"
          />
          <span>
            {t.appointment.recurring}
            <span className="block text-xs text-muted">{t.appointment.recurringHint}</span>
          </span>
        </label>

        <div className="flex justify-end gap-2 border-t border-line pt-4">
          <button onClick={onCancel} className="rounded-lg border border-line px-4 py-2 text-sm hover:bg-surface-2">
            {t.common.cancel}
          </button>
          <button
            onClick={submit}
            disabled={!title.trim()}
            className="rounded-lg bg-blue-600 px-4 py-2 text-sm text-white hover:bg-blue-700 disabled:opacity-40"
          >
            {t.appointment.create}
          </button>
        </div>
      </div>
    </div>
  );
}
