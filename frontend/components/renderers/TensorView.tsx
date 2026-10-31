import { useEffect, useRef, useState } from "react";
import type { TensorSummary } from "../../types/trace";
import { formatNumber } from "../../utils/format";

const MAX_ROWS = 8;
const MAX_COLS = 10;
// Below this many elements the numbers themselves are easier to read than stats.
const SUMMARY_MIN_SIZE = 16;
const HEATMAP_PX = 160;

type Cell = number | string;

interface Props {
  shape: number[];
  dtype?: string;
  contents: unknown;
  summary?: TensorSummary;
  truncated?: boolean;
}

export function TensorView({ shape, dtype, contents, summary, truncated }: Props) {
  const size = shape.reduce((a, b) => a * b, 1);
  // Full 1D vectors keep the row of numbers they always had; it truncates with "…".
  const tableFits = shape.length === 1
    ? !truncated
    : shape.length === 2 && shape[0] <= MAX_ROWS && shape[1] <= MAX_COLS;
  const [showNumbers, setShowNumbers] = useState(false);

  if (shape.length === 0) {
    return <span className="value-num">{formatNumber(contents as number)}</span>;
  }

  const label = shape.join(" × ");
  const dtypeShort = dtype?.replace("torch.", "").replace("float64", "f64").replace("float32", "f32")
    .replace("int64", "i64").replace("int32", "i32") ?? "";
  // Small tensors read best as numbers; everything else as a heatmap, unless the
  // full values were sent and the reader asks for them.
  const heatmap = !tableFits && !(showNumbers && !truncated && shape.length <= 2);
  const canToggle = !tableFits && !truncated && shape.length <= 2;

  return (
    <span className="tensor-wrap">
      <span className="tensor-label">
        [{label}] {dtypeShort}
        {canToggle && (
          <button className="value-toggle tensor-toggle" onClick={() => setShowNumbers(!showNumbers)}>
            {showNumbers ? "heatmap" : "numbers"}
          </button>
        )}
      </span>
      {summary && size > SUMMARY_MIN_SIZE && <SummaryLine summary={summary} />}
      {heatmap
        ? <Heatmap grid={firstSlice(contents, shape, truncated)} approximate={!!truncated} />
        : <NumberTable shape={shape} contents={contents} />}
    </span>
  );
}

function SummaryLine({ summary }: { summary: TensorSummary }) {
  const { mean, std, min, max, nan, inf } = summary;
  return (
    <span className="tensor-summary">
      {mean !== undefined && (
        <>
          <span title="mean">μ {formatStat(mean)}</span>
          <span title="standard deviation">σ {formatStat(std!)}</span>
          <span title="min, max">[{formatStat(min!)}, {formatStat(max!)}]</span>
        </>
      )}
      {nan > 0 && <span className="tensor-badge">NaN ×{nan}</span>}
      {inf > 0 && <span className="tensor-badge">inf ×{inf}</span>}
    </span>
  );
}

function NumberTable({ shape, contents }: { shape: number[]; contents: unknown }) {
  if (shape.length === 1) {
    const row = contents as Cell[];
    const truncate = row.length > MAX_COLS;
    const visible = truncate ? [...row.slice(0, MAX_COLS - 1), "…", row[row.length - 1]] : row;
    return (
      <table className="matrix">
        <tbody>
          <tr>
            {visible.map((v, i) => (
              <td key={i} className={v === "…" ? "matrix-ellipsis" : ""}>
                {v === "…" ? "…" : formatNumber(v)}
              </td>
            ))}
          </tr>
        </tbody>
      </table>
    );
  }

  const rows = contents as Cell[][];
  const truncateRows = rows.length > MAX_ROWS;
  const truncateCols = shape[1] > MAX_COLS;
  const visibleRows = truncateRows
    ? [...rows.slice(0, MAX_ROWS - 2), null, rows[rows.length - 1]]
    : rows;

  return (
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
                  {v === "…" ? "…" : formatNumber(v)}
                </td>
              ))}
            </tr>
          );
        })}
      </tbody>
    </table>
  );
}

function Heatmap({ grid, approximate }: { grid: Cell[][]; approximate: boolean }) {
  const ref = useRef<HTMLCanvasElement>(null);
  const [hover, setHover] = useState<string | null>(null);
  const rows = grid.length;
  const cols = grid[0]?.length ?? 0;
  const cellW = Math.max(1, Math.floor(HEATMAP_PX / Math.max(cols, 1)));
  const cellH = rows === 1 ? 14 : Math.max(1, Math.floor(HEATMAP_PX / rows));

  useEffect(() => {
    const ctx = ref.current?.getContext("2d");
    if (!ctx) return;
    const color = colorScale(grid);
    for (let r = 0; r < rows; r++) {
      for (let c = 0; c < cols; c++) {
        ctx.fillStyle = color(grid[r][c]);
        ctx.fillRect(c * cellW, r * cellH, cellW, cellH);
      }
    }
  }, [grid, rows, cols, cellW, cellH]);

  const onMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const c = Math.floor(((e.clientX - rect.left) / rect.width) * cols);
    const r = Math.floor(((e.clientY - rect.top) / rect.height) * rows);
    const v = grid[r]?.[c];
    if (v === undefined) return;
    const pos = rows === 1 ? `[${c}]` : `[${r}, ${c}]`;
    setHover(`${pos} ${approximate ? "≈ " : ""}${typeof v === "number" ? formatStat(v) : v}`);
  };

  return (
    <span className="tensor-heatmap">
      <canvas
        ref={ref}
        width={cols * cellW}
        height={rows * cellH}
        onMouseMove={onMove}
        onMouseLeave={() => setHover(null)}
      />
      <span className="tensor-hover">
        {hover ?? (approximate ? "first slice, block-averaged" : "first slice")}
      </span>
    </span>
  );
}

/** The 2D grid to draw: the server's preview, or the first 2D slice of full contents. */
function firstSlice(contents: unknown, shape: number[], truncated?: boolean): Cell[][] {
  if (truncated) return contents as Cell[][];
  if (shape.length === 1) return [contents as Cell[]];
  let x = contents as unknown[];
  for (let d = shape.length; d > 2; d--) x = x[0] as unknown[];
  return x as Cell[][];
}

/** Diverging blue–white–red around 0 for signed data, white–blue otherwise; NaN/inf in black. */
function colorScale(grid: Cell[][]): (v: Cell) => string {
  let lo = Infinity;
  let hi = -Infinity;
  for (const row of grid) {
    for (const v of row) {
      if (typeof v === "number") {
        lo = Math.min(lo, v);
        hi = Math.max(hi, v);
      }
    }
  }
  if (lo === Infinity) return () => "#000";
  if (lo < 0 && hi > 0) {
    const m = Math.max(-lo, hi);
    return (v) => typeof v !== "number" ? "#000"
      : v < 0 ? mix(WHITE, BLUE, -v / m) : mix(WHITE, RED, v / m);
  }
  const span = hi - lo || 1;
  return (v) => typeof v !== "number" ? "#000" : mix(WHITE, BLUE, (v - lo) / span);
}

const WHITE = [247, 247, 247];
const BLUE = [33, 102, 172];
const RED = [178, 24, 43];

function mix(a: number[], b: number[], t: number): string {
  const c = a.map((x, i) => Math.round(x + (b[i] - x) * t));
  return `rgb(${c[0]},${c[1]},${c[2]})`;
}

function formatStat(x: number): string {
  if (x === 0) return "0";
  if (Math.abs(x) < 1e-3 || Math.abs(x) >= 1e4) return x.toExponential(2);
  return String(Number(x.toPrecision(3)));
}
