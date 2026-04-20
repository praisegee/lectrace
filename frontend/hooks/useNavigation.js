import { useCallback } from "react";
export function useNavigation(trace, stepIndex, setStep) {
    const go = useCallback((next) => {
        if (!trace)
            return;
        const clamped = Math.max(0, Math.min(next, trace.steps.length - 1));
        if (clamped !== stepIndex)
            setStep(clamped);
    }, [trace, stepIndex, setStep]);
    const stepForward = useCallback(() => go(stepIndex + 1), [go, stepIndex]);
    const stepBackward = useCallback(() => go(stepIndex - 1), [go, stepIndex]);
    const stepOverForward = useCallback(() => {
        if (!trace)
            return;
        go(getStepOver(trace, stepIndex, 1));
    }, [trace, stepIndex, go]);
    const stepOverBackward = useCallback(() => {
        if (!trace)
            return;
        go(getStepOver(trace, stepIndex, -1));
    }, [trace, stepIndex, go]);
    const stepUp = useCallback(() => {
        if (!trace)
            return;
        go(getStepUp(trace, stepIndex));
    }, [trace, stepIndex, go]);
    return { stepForward, stepBackward, stepOverForward, stepOverBackward, stepUp };
}
function getStepOver(trace, from, dir) {
    const current = trace.steps[from];
    let i = from + dir;
    while (i >= 0 && i < trace.steps.length) {
        const s = trace.steps[i];
        if (inSameFunction(s.stack, current.stack)) {
            const ln = s.stack.at(-1).line_number;
            const curLn = current.stack.at(-1).line_number;
            if (ln !== curLn)
                return i;
        }
        if (isAncestorOf(s.stack, current.stack))
            return i;
        i += dir;
    }
    return from;
}
function getStepUp(trace, from) {
    const current = trace.steps[from];
    let i = from + 1;
    while (i < trace.steps.length) {
        const s = trace.steps[i];
        if (!inSameFunction(s.stack, current.stack) && isAncestorOf(s.stack, current.stack)) {
            return i;
        }
        i++;
    }
    return from;
}
export function inSameFunction(a, b) {
    if (a.length !== b.length)
        return false;
    for (let i = 0; i < a.length - 1; i++) {
        if (a[i].path !== b[i].path || a[i].line_number !== b[i].line_number)
            return false;
    }
    return true;
}
export function isAncestorOf(ancestor, descendant) {
    if (ancestor.length >= descendant.length)
        return false;
    return ancestor.every((f, i) => f.path === descendant[i].path && f.line_number === descendant[i].line_number);
}
export function computeLinesToShow(trace, upTo) {
    const shown = new Set();
    const fileLines = {};
    for (let si = 0; si <= upTo; si++) {
        const frame = trace.steps[si].stack.at(-1);
        if (!frame)
            continue;
        let ln = frame.line_number;
        const path = frame.path;
        while (true) {
            const loc = `${path}:${ln}`;
            if (shown.has(loc))
                break;
            shown.add(loc);
            if (!fileLines[path]) {
                fileLines[path] = (trace.files[path] ?? "").split("\n");
            }
            const line = fileLines[path][ln - 1] ?? "";
            if (/^\w/.test(line) || ln <= 1)
                break;
            ln--;
        }
    }
    return shown;
}
