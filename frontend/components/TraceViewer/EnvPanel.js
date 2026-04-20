import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { ValueRenderer } from "../renderers/ValueRenderer";
import { useDrag } from "../../hooks/useDrag";
import { inSameFunction, isAncestorOf } from "../../hooks/useNavigation";
export function EnvPanel({ trace, stepIndex }) {
    const { position, onMouseDown, isDragging } = useDrag({ x: 20, y: 80 });
    const env = buildEnv(trace, stepIndex);
    if (Object.keys(env).length === 0)
        return null;
    return (_jsx("div", { className: "env-panel", style: {
            left: position.x,
            top: position.y,
            cursor: isDragging.current ? "grabbing" : "grab",
        }, onMouseDown: onMouseDown, children: _jsx("table", { className: "env-table", children: _jsx("tbody", { children: Object.entries(env).map(([name, value]) => (_jsxs("tr", { children: [_jsx("td", { className: "env-key", children: name }), _jsx("td", { className: "env-eq", children: "=" }), _jsx("td", { children: _jsx(ValueRenderer, { value: value }) })] }, name))) }) }) }));
}
function buildEnv(trace, stepIndex) {
    const current = trace.steps[stepIndex];
    const envs = [];
    for (let i = stepIndex; i >= 0; i--) {
        const step = trace.steps[i];
        if (inSameFunction(step.stack, current.stack)) {
            if (Object.keys(step.env).length > 0)
                envs.push(step.env);
        }
        else if (isAncestorOf(step.stack, current.stack)) {
            break;
        }
    }
    envs.reverse();
    const merged = {};
    for (const e of envs)
        Object.assign(merged, e);
    for (const key of Object.keys(merged)) {
        if (merged[key] === null)
            delete merged[key];
    }
    return merged;
}
