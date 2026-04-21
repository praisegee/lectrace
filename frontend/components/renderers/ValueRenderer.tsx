import type { Value } from "../../types/trace";
import { TensorView } from "./TensorView";
import { formatNumber } from "../../utils/format";

const TENSOR_TYPES = new Set(["torch.Tensor", "torch.nn.parameter.Parameter", "numpy.ndarray"]);

interface Props {
  value: Value;
}

export function ValueRenderer({ value }: Props) {
  return <span title={typeTitle(value)}>{renderValue(value)}</span>;
}

function renderValue(value: Value): React.ReactNode {
  if (!value.type) return <span className="value-unknown">{JSON.stringify(value)}</span>;

  switch (value.type) {
    case "NoneType": return "None";
    case "bool": return String(value.contents);
    case "int":
    case "float": return formatNumber(value.contents as number | string);
    case "str": return <span className="value-str">"{value.contents as string}"</span>;
    case "complex": {
      const c = value.contents as { real: number; imag: number };
      return `${formatNumber(c.real)}+${formatNumber(c.imag)}j`;
    }
  }

  if (TENSOR_TYPES.has(value.type) || value.type.startsWith("numpy.")) {
    if ("shape" in value && Array.isArray(value.shape)) {
      return <TensorView shape={value.shape as number[]} contents={value.contents} />;
    }
  }

  if (value.type.startsWith("sympy.")) {
    return <span className="value-sympy">{String(value.contents)}</span>;
  }

  if (Array.isArray(value.contents)) {
    if ((value.contents as Value[]).length === 0) return "[]";
    return (
      <table className="matrix">
        <tbody>
          <tr>{(value.contents as Value[]).map((v, i) => <td key={i}>{renderValue(v)}</td>)}</tr>
        </tbody>
      </table>
    );
  }

  if (typeof value.contents === "object" && value.contents !== null) {
    const entries = Object.entries(value.contents as Record<string, Value>);
    if (entries.length === 0) return "{}";
    return (
      <table className="dict">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k}>
              <td className="dict-key">{k}</td>
              <td className="dict-sep">:</td>
              <td>{renderValue(v)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  }

  return <span>{String(value.contents)}</span>;
}

function typeTitle(value: Value): string {
  let title = value.type;
  if ("dtype" in value && value.dtype) title += ` ${value.dtype}`;
  if ("shape" in value && Array.isArray(value.shape)) title += ` [${(value.shape as number[]).join(" × ")}]`;
  return title;
}
