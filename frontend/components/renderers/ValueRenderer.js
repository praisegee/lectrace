import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { TensorView } from "./TensorView";
import { formatNumber } from "../../utils/format";
const TENSOR_TYPES = new Set(["torch.Tensor", "torch.nn.parameter.Parameter", "numpy.ndarray"]);
export function ValueRenderer({ value }) {
    return _jsx("span", { title: typeTitle(value), children: renderValue(value) });
}
function renderValue(value) {
    if (!value.type)
        return _jsx("span", { className: "value-unknown", children: JSON.stringify(value) });
    switch (value.type) {
        case "NoneType": return "None";
        case "bool": return String(value.contents);
        case "int":
        case "float": return formatNumber(value.contents);
        case "str": return _jsxs("span", { className: "value-str", children: ["\"", value.contents, "\""] });
        case "complex": {
            const c = value.contents;
            return `${formatNumber(c.real)}+${formatNumber(c.imag)}j`;
        }
    }
    if (TENSOR_TYPES.has(value.type) || value.type.startsWith("numpy.")) {
        if ("shape" in value && Array.isArray(value.shape)) {
            return _jsx(TensorView, { shape: value.shape, contents: value.contents });
        }
    }
    if (value.type.startsWith("sympy.")) {
        return _jsx("span", { className: "value-sympy", children: String(value.contents) });
    }
    if (Array.isArray(value.contents)) {
        if (value.contents.length === 0)
            return "[]";
        return (_jsx("table", { className: "matrix", children: _jsx("tbody", { children: _jsx("tr", { children: value.contents.map((v, i) => _jsx("td", { children: renderValue(v) }, i)) }) }) }));
    }
    if (typeof value.contents === "object" && value.contents !== null) {
        const entries = Object.entries(value.contents);
        if (entries.length === 0)
            return "{}";
        return (_jsx("table", { className: "dict", children: _jsx("tbody", { children: entries.map(([k, v]) => (_jsxs("tr", { children: [_jsx("td", { className: "dict-key", children: k }), _jsx("td", { className: "dict-sep", children: ":" }), _jsx("td", { children: renderValue(v) })] }, k))) }) }));
    }
    return _jsx("span", { children: String(value.contents) });
}
function typeTitle(value) {
    let title = value.type;
    if ("dtype" in value && value.dtype)
        title += ` ${value.dtype}`;
    if ("shape" in value && Array.isArray(value.shape))
        title += ` [${value.shape.join(" × ")}]`;
    return title;
}
