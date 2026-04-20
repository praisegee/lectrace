import { useState, useEffect } from "react";
import type { Trace } from "../types/trace";

export function useTrace(path: string | null) {
  const [trace, setTrace] = useState<Trace | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!path) {
      setTrace(null);
      return;
    }

    let cancelled = false;
    setLoading(true);
    setError(null);

    const url = path.endsWith(".json") ? path : `./traces/${path}.json`;

    fetch(url)
      .then((res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.json();
      })
      .then((data) => {
        if (!cancelled) {
          setTrace(data as Trace);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (!cancelled) {
          setError(err.message);
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [path]);

  return { trace, loading, error };
}
