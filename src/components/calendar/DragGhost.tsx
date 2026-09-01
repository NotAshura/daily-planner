interface DragGhostProps {
  ghost: { x: number; y: number; title: string } | null;
}

export default function DragGhost({ ghost }: DragGhostProps) {
  if (!ghost) return null;
  return (
    <div
      className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-md bg-blue-600 px-2 py-1 text-xs text-white shadow-lg"
      style={{ left: ghost.x, top: ghost.y }}
    >
      {ghost.title}
    </div>
  );
}
