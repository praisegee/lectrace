import { formatNumber } from "../../utils/format";

interface Props {
  shape: number[];
  contents: unknown;
}

export function TensorView({ shape, contents }: Props) {
  if (shape.length === 0) {
    return <span>{formatNumber(contents as number)}</span>;
  }

  if (shape.length === 1) {
    const row = contents as (number | string)[];
    return (
      <table className="matrix">
        <tbody>
          <tr>{row.map((v, i) => <td key={i}>{formatNumber(v as number)}</td>)}</tr>
        </tbody>
      </table>
    );
  }

  if (shape.length === 2) {
    const rows = contents as (number | string)[][];
    return (
      <table className="matrix">
        <tbody>
          {rows.map((row, ri) => (
            <tr key={ri}>{row.map((v, ci) => <td key={ci}>{formatNumber(v as number)}</td>)}</tr>
          ))}
        </tbody>
      </table>
    );
  }

  if (shape.length === 3) {
    const slices = contents as (number | string)[][][];
    return (
      <table className="matrix">
        <tbody>
          {slices.flatMap((slice, si) => [
            ...(si > 0 ? [<tr key={`sep-${si}`}><td colSpan={slice[0].length}>&nbsp;</td></tr>] : []),
            ...slice.map((row, ri) => (
              <tr key={`${si}-${ri}`}>
                {row.map((v, ci) => <td key={ci}>{formatNumber(v as number)}</td>)}
              </tr>
            )),
          ])}
        </tbody>
      </table>
    );
  }

  return <span className="value-fallback">{JSON.stringify(contents)}</span>;
}
