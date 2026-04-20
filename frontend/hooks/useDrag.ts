import { useState, useRef, useEffect } from "react";

interface Position {
  x: number;
  y: number;
}

export function useDrag(initial: Position = { x: 20, y: 20 }) {
  const [position, setPosition] = useState<Position>(initial);
  const dragging = useRef(false);
  const offset = useRef<Position>({ x: 0, y: 0 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      if (!dragging.current) return;
      setPosition({ x: e.clientX - offset.current.x, y: e.clientY - offset.current.y });
    };
    const onUp = () => {
      dragging.current = false;
    };
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    };
  }, []);

  const onMouseDown = (e: React.MouseEvent<HTMLElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    offset.current = { x: e.clientX - rect.left, y: e.clientY - rect.top };
    dragging.current = true;
    e.preventDefault();
  };

  return { position, onMouseDown, isDragging: dragging };
}
