import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { TraceIndex } from "../types/trace";

export function TraceBrowser() {
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
      })
      .catch(() => null);
  }, []);

  if (!index || index.traces.length === 0) return null;

  const select = (id: string) =>
    setParams((p) => { p.set("trace", id); p.delete("step"); return p; });

  return (
    <nav className="trace-browser">
      <div className="trace-browser-title">Lectures</div>
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
