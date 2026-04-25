import { useRef } from "react";

export function useSwipe(onLeft: () => void, onRight: () => void) {
  const start = useRef<{ x: number; y: number } | null>(null);

  const onTouchStart = (e: React.TouchEvent) => {
    start.current = { x: e.touches[0].clientX, y: e.touches[0].clientY };
  };

  const onTouchEnd = (e: React.TouchEvent) => {
    if (!start.current) return;
    const dx = e.changedTouches[0].clientX - start.current.x;
    const dy = e.changedTouches[0].clientY - start.current.y;
    start.current = null;
    // Require horizontal bias and meaningful distance
    if (Math.abs(dx) < 48 || Math.abs(dy) > Math.abs(dx) * 0.75) return;
    if (dx < 0) onLeft();
    else onRight();
  };

  return { onTouchStart, onTouchEnd };
}
