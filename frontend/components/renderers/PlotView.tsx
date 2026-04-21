import { useEffect, useRef } from "react";
import embed from "vega-embed";

interface Props {
  spec: unknown;
  style?: React.CSSProperties;
}

export function PlotView({ spec, style }: Props) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current) return;
    let view: { finalize(): void } | null = null;
    embed(container.current, spec as Parameters<typeof embed>[1]).then((result) => {
      view = result.view;
    });
    return () => view?.finalize();
  }, [spec]);

  return <div ref={container} style={style} />;
}
