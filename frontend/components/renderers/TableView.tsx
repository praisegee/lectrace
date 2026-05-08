import type { TableData } from "../../types/trace";
import { formatNumber } from "../../utils/format";

interface Props {
  data: TableData;
  style?: React.CSSProperties;
}

export function TableView({ data, style }: Props) {
  const { headers, rows, caption } = data;

  const alignments: ("left" | "right")[] = headers.map((_, ci) => {
    for (const row of rows) {
      const v = row[ci];
      if (v !== null && v !== undefined) {
        return typeof v === "number" ? "right" : "left";
      }
    }
    return "left";
  });

  return (
    <div className="table-view" style={style}>
      {caption && <p className="table-caption">{caption}</p>}
      <div className="table-scroll">
        <table className="data-table">
          <thead>
            <tr>
              {headers.map((h, i) => (
                <th key={i} className={alignments[i] === "right" ? "align-right" : undefined}>
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, ri) => (
              <tr key={ri}>
                {row.map((cell, ci) => (
                  <td key={ci} className={alignments[ci] === "right" ? "align-right" : undefined}>
                    {renderCell(cell)}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

function renderCell(v: string | number | boolean | null): React.ReactNode {
  if (v === null || v === undefined) return <span className="table-cell-null">—</span>;
  if (typeof v === "number") return <span className="table-cell-num">{formatNumber(v)}</span>;
  if (typeof v === "boolean") return <span className="table-cell-bool">{v ? "True" : "False"}</span>;
  return v;
}
