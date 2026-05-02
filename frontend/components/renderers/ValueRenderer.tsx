import { useState } from "react";
import type { Value } from "../../types/trace";
import { TensorView } from "./TensorView";
import { formatNumber } from "../../utils/format";

const TENSOR_TYPES = new Set(["torch.Tensor", "torch.nn.parameter.Parameter", "numpy.ndarray"]);
const PRIMITIVE_TYPES = new Set(["int", "float", "bool", "str", "NoneType", "complex"]);

interface Props {
  value: Value;
}

export function ValueRenderer({ value }: Props) {
  return <span className="value-root">{renderValue(value, 0)}</span>;
}

export function shortType(value: Value): string {
  if (TENSOR_TYPES.has(value.type) || value.type.startsWith("numpy.")) {
    const shape = (value as { shape?: number[] }).shape;
    const dtype = (value as { dtype?: string }).dtype;
    if (shape) {
      const dims = shape.join(" × ");
      const d = dtype ? ` ${dtype.replace("float", "f").replace("int", "i").replace("64", "64").replace("32", "32")}` : "";
      return `[${dims}]${d}`;
    }
  }
  if (value.type === "list" || value.type === "tuple") {
    const n = Array.isArray(value.contents) ? value.contents.length : 0;
    return `${value.type}[${n}]`;
  }
  if (value.type === "dict") {
    const n = typeof value.contents === "object" && value.contents !== null
      ? Object.keys(value.contents).length : 0;
    return `dict[${n}]`;
  }
  if (value.type.includes(".")) return value.type.split(".").pop()!;
  return value.type;
}

function isPrimitive(v: Value): boolean {
  return PRIMITIVE_TYPES.has(v.type)
    || v.type.startsWith("numpy.int")
    || v.type.startsWith("numpy.float");
}

function renderValue(value: Value, depth: number): React.ReactNode {
  if (!value || !value.type) return <span className="value-unknown">?</span>;

  switch (value.type) {
    case "NoneType": return <span className="value-none">None</span>;
    case "bool": return <span className="value-bool">{String(value.contents)}</span>;
    case "int":
    case "float": return <span className="value-num">{formatNumber(value.contents as number | string)}</span>;
    case "str": {
      const s = value.contents as string;
      const truncated = s.length > 80;
      return (
        <span className="value-str" title={truncated ? s : undefined}>
          "{truncated ? s.slice(0, 80) + "…" : s}"
        </span>
      );
    }
    case "complex": {
      const c = value.contents as { real: number; imag: number };
      return <span className="value-num">{formatNumber(c.real)}+{formatNumber(c.imag)}j</span>;
    }
  }

  if (TENSOR_TYPES.has(value.type) || value.type.startsWith("numpy.")) {
    if ("shape" in value && Array.isArray(value.shape)) {
      const dtype = (value as { dtype?: string }).dtype;
      if (dtype !== "object") {
        return (
          <TensorView
            shape={value.shape as number[]}
            dtype={dtype}
            contents={value.contents}
          />
        );
      }
      // object-dtype arrays have Value[] contents — fall through to ListValue below
    }
    if (isPrimitive(value)) {
      return <span className="value-num">{formatNumber(value.contents as number)}</span>;
    }
  }

  if (value.type.startsWith("sympy.")) {
    return <span className="value-sympy">{String(value.contents)}</span>;
  }

  if (Array.isArray(value.contents)) {
    return <ListValue items={value.contents as Value[]} label={value.type} depth={depth} />;
  }

  if (typeof value.contents === "object" && value.contents !== null) {
    return (
      <DictValue
        entries={Object.entries(value.contents as Record<string, Value>)}
        depth={depth}
      />
    );
  }

  return <span>{String(value.contents)}</span>;
}

function ListValue({ items, label, depth }: { items: Value[]; label: string; depth: number }) {
  const [expanded, setExpanded] = useState(depth === 0);

  if (items.length === 0) return <span className="value-empty">[]</span>;

  const allPrimitive = items.every(isPrimitive);

  // Short primitive list: inline
  if (allPrimitive && items.length <= 10) {
    return (
      <span className="value-list-inline">
        [{items.map((v, i) => (
          <span key={i}>
            {renderValue(v, depth + 1)}
            {i < items.length - 1 && <span className="value-sep">, </span>}
          </span>
        ))}]
      </span>
    );
  }

  // Long primitive list: truncated inline
  if (allPrimitive) {
    const preview = items.slice(0, 6);
    const rest = items.length - 6;
    return expanded ? (
      <span className="value-list-inline">
        <button className="value-toggle" onClick={() => setExpanded(false)}>▼</button>
        [{items.map((v, i) => (
          <span key={i}>
            {renderValue(v, depth + 1)}
            {i < items.length - 1 && <span className="value-sep">, </span>}
          </span>
        ))}]
      </span>
    ) : (
      <span className="value-list-inline">
        [{preview.map((v, i) => (
          <span key={i}>{renderValue(v, depth + 1)}<span className="value-sep">, </span></span>
        ))}
        <button className="value-toggle value-more" onClick={() => setExpanded(true)}>+{rest} more</button>]
      </span>
    );
  }

  // Complex list: collapsible
  if (!expanded) {
    return (
      <button className="value-toggle value-collapsible" onClick={() => setExpanded(true)}>
        ▶ {label}[{items.length}]
      </button>
    );
  }

  return (
    <span className="value-complex">
      <button className="value-toggle" onClick={() => setExpanded(false)}>▼ {label}[{items.length}]</button>
      <table className="value-list-table">
        <tbody>
          {items.map((v, i) => (
            <tr key={i}>
              <td className="list-index">{i}</td>
              <td>{renderValue(v, depth + 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </span>
  );
}

function DictValue({ entries, depth }: { entries: [string, Value][]; depth: number }) {
  const [expanded, setExpanded] = useState(depth <= 1);

  if (entries.length === 0) return <span className="value-empty">{"{}"}</span>;

  if (!expanded) {
    return (
      <button className="value-toggle value-collapsible" onClick={() => setExpanded(true)}>
        ▶ {"{"}{entries.length} keys{"}"}
      </button>
    );
  }

  return (
    <span className="value-complex">
      {depth > 0 && (
        <button className="value-toggle" onClick={() => setExpanded(false)}>
          ▼ {"{"}{entries.length} keys{"}"}
        </button>
      )}
      <table className="dict">
        <tbody>
          {entries.map(([k, v]) => (
            <tr key={k}>
              <td className="dict-key">{k}</td>
              <td className="dict-sep">:</td>
              <td>{renderValue(v, depth + 1)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </span>
  );
}
