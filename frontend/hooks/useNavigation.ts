import { useCallback } from "react";
import type { Trace, StackFrame } from "../types/trace";

export function useNavigation(
  trace: Trace | null,
  stepIndex: number,
  setStep: (i: number) => void,
) {
  const go = useCallback(
    (next: number) => {
      if (!trace) return;
      const clamped = Math.max(0, Math.min(next, trace.steps.length - 1));
      if (clamped !== stepIndex) setStep(clamped);
    },
    [trace, stepIndex, setStep],
  );

  const stepForward = useCallback(() => go(stepIndex + 1), [go, stepIndex]);
  const stepBackward = useCallback(() => go(stepIndex - 1), [go, stepIndex]);

  const stepOverForward = useCallback(() => {
    if (!trace) return;
    go(getStepOver(trace, stepIndex, 1));
  }, [trace, stepIndex, go]);

  const stepOverBackward = useCallback(() => {
    if (!trace) return;
    go(getStepOver(trace, stepIndex, -1));
  }, [trace, stepIndex, go]);

  const stepUp = useCallback(() => {
    if (!trace) return;
    go(getStepUp(trace, stepIndex));
  }, [trace, stepIndex, go]);

  return { stepForward, stepBackward, stepOverForward, stepOverBackward, stepUp };
}

function getStepOver(trace: Trace, from: number, dir: 1 | -1): number {
  const current = trace.steps[from];
  let i = from + dir;
  while (i >= 0 && i < trace.steps.length) {
    const s = trace.steps[i];
    if (inSameFunction(s.stack, current.stack)) {
      const ln = s.stack.at(-1)!.line_number;
      const curLn = current.stack.at(-1)!.line_number;
      if (ln !== curLn) return i;
    }
    if (isAncestorOf(s.stack, current.stack)) return i;
    i += dir;
  }
  return from;
}

function getStepUp(trace: Trace, from: number): number {
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

export function inSameFunction(a: StackFrame[], b: StackFrame[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length - 1; i++) {
    if (a[i].path !== b[i].path || a[i].line_number !== b[i].line_number) return false;
  }
  return true;
}

export function isAncestorOf(ancestor: StackFrame[], descendant: StackFrame[]): boolean {
  if (ancestor.length >= descendant.length) return false;
  return ancestor.every((f, i) => f.path === descendant[i].path && f.line_number === descendant[i].line_number);
}

export function computeLinesToShow(trace: Trace, upTo: number): Set<string> {
  const shown = new Set<string>();
  const fileLines: Record<string, string[]> = {};

  for (let si = 0; si <= upTo; si++) {
    const frame = trace.steps[si].stack.at(-1);
    if (!frame) continue;

    let ln = frame.line_number;
    const path = frame.path;

    while (true) {
      const loc = `${path}:${ln}`;
      if (shown.has(loc)) break;
      shown.add(loc);

      if (!fileLines[path]) {
        fileLines[path] = (trace.files[path] ?? "").split("\n");
      }
      const line = fileLines[path][ln - 1] ?? "";
      if (/^\w/.test(line) || ln <= 1) break;
      ln--;
    }
  }

  return shown;
}
