import { jsx as _jsx } from "react/jsx-runtime";
import { formatNumber } from "../../utils/format";
export function TensorView({ shape, contents }) {
    if (shape.length === 0) {
        return _jsx("span", { children: formatNumber(contents) });
    }
    if (shape.length === 1) {
        const row = contents;
        return (_jsx("table", { className: "matrix", children: _jsx("tbody", { children: _jsx("tr", { children: row.map((v, i) => _jsx("td", { children: formatNumber(v) }, i)) }) }) }));
    }
    if (shape.length === 2) {
        const rows = contents;
        return (_jsx("table", { className: "matrix", children: _jsx("tbody", { children: rows.map((row, ri) => (_jsx("tr", { children: row.map((v, ci) => _jsx("td", { children: formatNumber(v) }, ci)) }, ri))) }) }));
    }
    if (shape.length === 3) {
        const slices = contents;
        return (_jsx("table", { className: "matrix", children: _jsx("tbody", { children: slices.flatMap((slice, si) => [
                    ...(si > 0 ? [_jsx("tr", { children: _jsx("td", { colSpan: slice[0].length, children: "\u00A0" }) }, `sep-${si}`)] : []),
                    ...slice.map((row, ri) => (_jsx("tr", { children: row.map((v, ci) => _jsx("td", { children: formatNumber(v) }, ci)) }, `${si}-${ri}`))),
                ]) }) }));
    }
    return _jsx("span", { className: "value-fallback", children: JSON.stringify(contents) });
}
