import type { Trace, Value } from "../../types/trace";
import { ValueRenderer, shortType } from "../renderers/ValueRenderer";
import { inSameFunction, isAncestorOf } from "../../hooks/useNavigation";

interface Props {
  trace: Trace;
  stepIndex: number;
}

export function EnvPanel({ trace, stepIndex }: Props) {
  const env = buildEnv(trace, stepIndex);
  if (Object.keys(env).length === 0) return null;

  return (
    <div className="env-panel">
      <div className="env-header">Variables</div>
      <table className="env-table">
        <tbody>
          {Object.entries(env).map(([name, value]) => (
            <tr key={name}>
              <td className="env-key">
                {name}
                <span className="env-type">{shortType(value)}</span>
              </td>
              <td className="env-eq">=</td>
              <td className="env-val"><ValueRenderer value={value} /></td>
            </tr>
          ))}
        </tbody>
      </table>
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
