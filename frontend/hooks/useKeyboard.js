import { useEffect } from "react";
export function useKeyboard(handlers, deps) {
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.altKey || e.ctrlKey || e.metaKey)
                return;
            const key = [
                e.shiftKey ? "Shift+" : "",
                e.key,
            ].join("");
            const handler = handlers[key] ?? handlers[e.key];
            if (handler) {
                handler(e);
                e.preventDefault();
                e.stopPropagation();
            }
        };
        window.addEventListener("keydown", onKeyDown);
        return () => window.removeEventListener("keydown", onKeyDown);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, deps);
}
