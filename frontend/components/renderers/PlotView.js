import { jsx as _jsx } from "react/jsx-runtime";
import { useEffect, useRef } from "react";
import embed from "vega-embed";
export function PlotView({ spec, style }) {
    const container = useRef(null);
    useEffect(() => {
        if (!container.current)
            return;
        let view = null;
        embed(container.current, spec).then((result) => {
            view = result.view;
        });
        return () => view?.finalize();
    }, [spec]);
    return _jsx("div", { ref: container, style: style });
}
