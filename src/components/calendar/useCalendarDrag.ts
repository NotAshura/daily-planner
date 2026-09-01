import { useEffect, useRef, useState } from "react";
import type { Block } from "../../types";

export const START_HOUR = 6;
export const END_HOUR = 24;
export const HOUR_HEIGHT = 48;
export const PX_PER_MIN = HOUR_HEIGHT / 60;
export const TOTAL_MIN = (END_HOUR - START_HOUR) * 60;
export const DEFAULT_DURATION = 30;

const SNAP = 15;
const MIN_DURATION = 15;

export interface DraftRange {
  date: string;
  start: number;
  duration: number;
}

type DragState =
  | { kind: "create"; taskId: string }
  | { kind: "move"; blockId: string; offsetMin: number }
  | { kind: "resize"; blockId: string }
  | { kind: "draw"; date: string; anchor: number };

interface Options {
  /** Date keys of the visible columns, left to right. */
  days: string[];
  blocks: Block[];
  onCreateBlock: (taskId: string, date: string, start: number) => void;
  onUpdateBlock: (id: string, patch: Partial<Block>) => void;
  onDraw: (range: DraftRange) => void;
}

const snap = (min: number) => Math.round(min / SNAP) * SNAP;
const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/** Pointer-based dragging shared by the day and the week calendar. */
export function useCalendarDrag({ days, blocks, onCreateBlock, onUpdateBlock, onDraw }: Options) {
  const gridRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);
  const draftRef = useRef<DraftRange | null>(null);
  const [ghost, setGhost] = useState<{ x: number; y: number; title: string } | null>(null);
  const [draft, setDraft] = useState<DraftRange | null>(null);

  const updateDraft = (range: DraftRange | null) => {
    draftRef.current = range;
    setDraft(range);
  };

  const slotAt = (clientX: number, clientY: number) => {
    const grid = gridRef.current;
    if (!grid) return null;
    const rect = grid.getBoundingClientRect();
    if (clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) {
      return null;
    }
    const index = clamp(
      Math.floor(((clientX - rect.left) / rect.width) * days.length),
      0,
      days.length - 1
    );
    return { date: days[index], minute: START_HOUR * 60 + (clientY - rect.top) / PX_PER_MIN };
  };

  useEffect(() => {
    const onPointerMove = (e: PointerEvent) => {
      const drag = dragRef.current;
      if (!drag) return;
      e.preventDefault();

      if (drag.kind === "create") {
        setGhost((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev));
        return;
      }

      const slot = slotAt(e.clientX, e.clientY);
      if (!slot) return;

      if (drag.kind === "draw") {
        const current = clamp(snap(slot.minute), START_HOUR * 60, END_HOUR * 60);
        const duration = Math.max(MIN_DURATION, Math.abs(current - drag.anchor));
        const start = clamp(Math.min(drag.anchor, current), START_HOUR * 60, END_HOUR * 60 - duration);
        updateDraft({ date: drag.date, start, duration });
        return;
      }

      const block = blocks.find((b) => b.id === drag.blockId);
      if (!block) return;

      if (drag.kind === "move") {
        const start = clamp(
          snap(slot.minute - drag.offsetMin),
          START_HOUR * 60,
          END_HOUR * 60 - block.duration
        );
        if (start !== block.start || slot.date !== block.date) {
          onUpdateBlock(block.id, { start, date: slot.date });
        }
      } else {
        const duration = clamp(
          snap(slot.minute - block.start),
          MIN_DURATION,
          END_HOUR * 60 - block.start
        );
        if (duration !== block.duration) onUpdateBlock(block.id, { duration });
      }
    };

    const onPointerUp = (e: PointerEvent) => {
      const drag = dragRef.current;
      dragRef.current = null;
      setGhost(null);

      if (drag?.kind === "create") {
        const slot = slotAt(e.clientX, e.clientY);
        if (!slot) return;
        const start = clamp(snap(slot.minute), START_HOUR * 60, END_HOUR * 60 - DEFAULT_DURATION);
        onCreateBlock(drag.taskId, slot.date, start);
        return;
      }

      // The draft stays visible until the caller closes its dialog.
      if (drag?.kind === "draw" && draftRef.current) onDraw(draftRef.current);
    };

    window.addEventListener("pointermove", onPointerMove, { passive: false });
    window.addEventListener("pointerup", onPointerUp);
    window.addEventListener("pointercancel", onPointerUp);
    return () => {
      window.removeEventListener("pointermove", onPointerMove);
      window.removeEventListener("pointerup", onPointerUp);
      window.removeEventListener("pointercancel", onPointerUp);
    };
  });

  return {
    gridRef,
    ghost,
    draft,
    clearDraft: () => updateDraft(null),
    startCreate: (e: React.PointerEvent, task: { id: string; title: string }) => {
      dragRef.current = { kind: "create", taskId: task.id };
      setGhost({ x: e.clientX, y: e.clientY, title: task.title });
    },
    startMove: (e: React.PointerEvent, block: Block) => {
      const slot = slotAt(e.clientX, e.clientY);
      dragRef.current = {
        kind: "move",
        blockId: block.id,
        offsetMin: slot ? slot.minute - block.start : 0,
      };
    },
    startResize: (block: Block) => {
      dragRef.current = { kind: "resize", blockId: block.id };
    },
    startDraw: (e: React.PointerEvent, date: string) => {
      const slot = slotAt(e.clientX, e.clientY);
      if (!slot) return;
      const anchor = clamp(snap(slot.minute), START_HOUR * 60, END_HOUR * 60);
      dragRef.current = { kind: "draw", date, anchor };
      updateDraft({
        date,
        start: Math.min(anchor, END_HOUR * 60 - DEFAULT_DURATION),
        duration: DEFAULT_DURATION,
      });
    },
  };
}
