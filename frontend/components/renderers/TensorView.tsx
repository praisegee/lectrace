import { formatNumber } from "../../utils/format";

const MAX_ROWS = 8;
const MAX_COLS = 10;

interface Props {
  shape: number[];
  dtype?: string;
  contents: unknown;
}

export function TensorView({ shape, dtype, contents }: Props) {
  const label = shape.join(" × ");
  const dtypeShort = dtype?.replace("float64", "f64").replace("float32", "f32")
    .replace("int64", "i64").replace("int32", "i32") ?? "";

  if (shape.length === 0) {
    return <span className="value-num">{formatNumber(contents as number)}</span>;
  }

  if (shape.length === 1) {
    const row = contents as (number | string)[];
    const truncate = row.length > MAX_COLS;
    const visible = truncate ? [...row.slice(0, MAX_COLS - 1), "…", row[row.length - 1]] : row;
    return (
      <span className="tensor-wrap">
        <span className="tensor-label">[{label}] {dtypeShort}</span>
        <table className="matrix">
          <tbody>
            <tr>
              {visible.map((v, i) => (
                <td key={i} className={v === "…" ? "matrix-ellipsis" : ""}>
                  {v === "…" ? "…" : formatNumber(v as number)}
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </span>
    );
  }

  if (shape.length === 2) {
    const rows = contents as (number | string)[][];
    const truncateRows = rows.length > MAX_ROWS;
    const truncateCols = shape[1] > MAX_COLS;
    const visibleRows = truncateRows
      ? [...rows.slice(0, MAX_ROWS - 2), null, rows[rows.length - 1]]
      : rows;

    return (
      <span className="tensor-wrap">
        <span className="tensor-label">[{label}] {dtypeShort}</span>
        <table className="matrix">
          <tbody>
            {visibleRows.map((row, ri) => {
              if (row === null) {
                return (
                  <tr key="ellipsis">
                    <td colSpan={truncateCols ? MAX_COLS + 1 : shape[1]} className="matrix-ellipsis">⋮</td>
                  </tr>
                );
              }
              const visibleCols = truncateCols
                ? [...row.slice(0, MAX_COLS - 1), "…", row[row.length - 1]]
                : row;
              return (
                <tr key={ri}>
                  {visibleCols.map((v, ci) => (
                    <td key={ci} className={v === "…" ? "matrix-ellipsis" : ""}>
                      {v === "…" ? "…" : formatNumber(v as number)}
                    </td>
                  ))}
                </tr>
              );
            })}
          </tbody>
        </table>
      </span>
    );
  }

  // Higher dims: just show shape label
  return (
    <span className="tensor-wrap">
      <span className="tensor-label">[{label}] {dtypeShort}</span>
      <span className="value-muted">tensor</span>
    </span>
  );
}
