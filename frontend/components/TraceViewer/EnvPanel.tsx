import { useEffect, useRef } from "react";
import type { Trace, Value, StackFrame } from "../../types/trace";
import { ValueRenderer, shortType } from "../renderers/ValueRenderer";
import { inSameFunction, isAncestorOf } from "../../hooks/useNavigation";

interface Props {
  trace: Trace;
  stepIndex: number;
}

export function EnvPanel({ trace, stepIndex }: Props) {
  const step = trace.steps[stepIndex];
  const stack = step?.stack ?? [];

  const env = buildEnv(trace, stepIndex);

  const prevStep = stepIndex > 0 ? trace.steps[stepIndex - 1] : null;
  const inSameFn = prevStep ? inSameFunction(prevStep.stack, step.stack) : false;
  const prevEnv = inSameFn ? buildEnv(trace, stepIndex - 1) : {};

  const hasVars = Object.keys(env).length > 0;
  const showStack = stack.length > 1;

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: "end", behavior: "smooth" });
  }, [stepIndex]);

  if (!hasVars && !showStack) return null;

  const currentFn = stack.at(-1)?.function_name;

  return (
    <div className="env-panel">
      {showStack && <CallStack stack={stack} />}

      {hasVars && (
        <>
          <div className="env-header">
            Variables
            {currentFn && <span className="env-fn-context">in {currentFn}()</span>}
          </div>
          <table className="env-table">
            <tbody>
              {Object.entries(env).map(([name, value]) => {
                const isNew = !(name in prevEnv);
                const isChanged = !isNew &&
                  JSON.stringify(prevEnv[name]) !== JSON.stringify(value);
                const status = isNew ? "new" : isChanged ? "changed" : null;

                return (
                  <tr key={name} className={status ? `env-row--${status}` : ""}>
                    <td className="env-key">
                      <span className="env-key-inner">
                        {status && (
                          <span
                            className={`env-dot env-dot--${status}`}
                            title={status === "new" ? "New variable" : "Value changed"}
                          />
                        )}
                        {name}
                      </span>
                      <span className="env-type">{shortType(value)}</span>
                    </td>
                    <td className="env-eq">=</td>
                    <td className="env-val"><ValueRenderer value={value} /></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </>
      )}
      <div ref={bottomRef} />
    </div>
  );
}

function CallStack({ stack }: { stack: StackFrame[] }) {
  return (
    <div className="call-stack">
      <div className="env-section-label">Call Stack</div>
      <div className="call-stack-frames">
        {stack.map((frame, i) => {
          const isCurrent = i === stack.length - 1;
          return (
            <div key={i} className={`stack-frame${isCurrent ? " stack-frame--current" : ""}`}>
              <span
                className="stack-frame-indent"
                style={{ width: `${i * 12}px`, flexShrink: 0 }}
              />
              <span className="stack-frame-arrow">{isCurrent ? "▶" : "·"}</span>
              <span className="stack-frame-fn">{frame.function_name}</span>
              <span className="stack-frame-line">:{frame.line_number}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function buildEnv(trace: Trace, stepIndex: number): Record<string, Value> {
  const current = trace.steps[stepIndex];
  const envs: Record<string, Value | null>[] = [];

  for (let i = stepIndex; i >= 0; i--) {
    const step = trace.steps[i];
    if (inSameFunction(step.stack, current.stack)) {
      if (Object.keys(step.env).length > 0) envs.push(step.env as Record<string, Value | null>);
    } else if (isAncestorOf(step.stack, current.stack)) {
      break;
    }
  }

  envs.reverse();
  const merged: Record<string, Value | null> = {};
  for (const e of envs) Object.assign(merged, e);
  for (const key of Object.keys(merged)) {
    if (merged[key] === null) delete merged[key];
  }
  return merged as Record<string, Value>;
}
