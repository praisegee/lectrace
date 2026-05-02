import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { TraceIndex } from "../types/trace";
import { CloseIcon } from "./icons";

interface Props {
  open?: boolean;
  onClose?: () => void;
  onReady?: () => void;
}

export function TraceBrowser({ open, onClose, onReady }: Props) {
  const [index, setIndex] = useState<TraceIndex | null>(null);
  const [params, setParams] = useSearchParams();
  const active = params.get("trace");

  useEffect(() => {
    fetch("./traces/index.json")
      .then((r) => r.json())
      .then((data: TraceIndex) => {
        setIndex(data);
        if (!params.get("trace") && data.traces.length > 0) {
          setParams((p) => { p.set("trace", data.traces[0].id); return p; });
        }
        onReady?.();
      })
      .catch(() => { onReady?.(); });
  }, []);

  if (!index || index.traces.length === 0) return null;

  const select = (id: string) => {
    setParams((p) => { p.set("trace", id); p.delete("step"); return p; });
    onClose?.();
  };

  return (
    <nav className={`trace-browser${open ? " drawer-open" : ""}`}>
      <div className="trace-browser-header">
        <div className="trace-browser-title">Lectures</div>
        <button className="drawer-close" onClick={onClose} aria-label="Close">
          <CloseIcon size={17} />
        </button>
      </div>
      <ul>
        {index.traces.map((entry) => (
          <li
            key={entry.id}
            className={entry.id === active ? "active" : ""}
            onClick={() => select(entry.id)}
          >
            <span className="entry-title">{entry.title}</span>
            <span className="entry-steps">{entry.step_count} steps</span>
          </li>
        ))}
      </ul>
    </nav>
  );
}
