import { useState, useEffect } from "react";
export function useTrace(path) {
    const [trace, setTrace] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
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
            if (!res.ok)
                throw new Error(`HTTP ${res.status}`);
            return res.json();
        })
            .then((data) => {
            if (!cancelled) {
                setTrace(data);
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
