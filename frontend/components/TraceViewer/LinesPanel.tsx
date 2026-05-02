import { useMemo, useCallback } from "react";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github.css";
import type { Trace, Rendering } from "../../types/trace";
import { computeLinesToShow } from "../../hooks/useNavigation";
import { MarkdownView } from "../renderers/MarkdownView";
import { ExternalLinkCard } from "../renderers/ExternalLinkCard";
import { PlotView } from "../renderers/PlotView";

hljs.registerLanguage("python", python);

interface Props {
  trace: Trace;
  path: string;
  lineNumber: number;
  stepIndex: number;
  rawMode: boolean;
  animateMode: boolean;
  entryDefLine: number | null;
  onGotoLine: (ln: number) => void;
  onGotoLocation: (path: string, ln: number) => void;
}

export function LinesPanel({
  trace, path, lineNumber, stepIndex,
  rawMode, animateMode, entryDefLine,
  onGotoLine, onGotoLocation,
}: Props) {
  const fileContents = trace.files[path] ?? "";

  const highlightedLines = useMemo(() => {
    const highlighted = hljs.highlight(fileContents, { language: "python" }).value;
    return highlighted.split("\n");
  }, [fileContents]);

  const linesToShow = useMemo(
    () => computeLinesToShow(trace, stepIndex),
    [trace, stepIndex],
  );

  const lineToRenderings = useMemo(() => {
    const map = new Map<number, Rendering[]>();
    for (const step of trace.steps) {
      const frame = step.stack.at(-1);
      if (frame) map.set(frame.line_number, step.renderings);
    }
    return map;
  }, [trace.steps]);

  const hidden = new Set(trace.hidden_line_numbers[path] ?? []);

  const sourceLines = useMemo(() => fileContents.split("\n"), [fileContents]);

  const scrollRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const inView = rect.top >= 50 && rect.bottom <= window.innerHeight - 50;
    if (!inView) {
      const dist = Math.min(Math.abs(rect.top), Math.abs(rect.bottom - window.innerHeight));
      el.scrollIntoView({ behavior: dist < 150 ? "smooth" : "instant", block: "center" });
    }
  }, []);

  const entryDefRef = useCallback((el: HTMLElement | null) => {
    if (!el) return;
    el.scrollIntoView({ behavior: "instant", block: "start" });
    const container = el.closest(".viewer-code");
    if (container) container.scrollTop -= 80;
  }, []);

  let prevVisibleLn = 0;

  return (
    <div className="lines-panel">
      {highlightedLines.map((htmlLine, idx) => {
        const ln = idx + 1;
        if (!rawMode && hidden.has(ln)) return null;

        const showGap = !rawMode && prevVisibleLn > 0 && ln > prevVisibleLn + 1;
        prevVisibleLn = ln;

        const loc = `${path}:${ln}`;
        const isCurrent = ln === lineNumber;
        const cloaked = animateMode && !linesToShow.has(loc);
        const renderings = lineToRenderings.get(ln) ?? [];
        const hasRenderings = !rawMode && renderings.length > 0;
        const rawLine = sourceLines[idx] ?? "";
        const indent = rawLine.length - rawLine.trimStart().length;
        const lineRef = ln === entryDefLine ? entryDefRef
          : (isCurrent && entryDefLine === null ? scrollRef : null);
        return (
          <div key={ln}>
            {showGap && <div className="line-gap" />}
            <div
              ref={lineRef}
              className={["line", isCurrent ? "current-line" : "", cloaked ? "cloaked" : "", hasRenderings ? "has-renderings" : ""].filter(Boolean).join(" ")}
            >
              <span
                className="line-number"
                onClick={() => onGotoLine(ln)}
                title={`Go to line ${ln}`}
              >
                {ln}
              </span>
              {hasRenderings ? (
                <div
                  className="renderings"
                  style={indent > 0 ? { paddingLeft: `${indent * 0.6}em` } : undefined}
                >
                  {renderings.map((r, i) => (
                    <div key={i}>{renderRendering(r, onGotoLocation)}</div>
                  ))}
                </div>
              ) : (
                <span
                  className="code-line"
                  dangerouslySetInnerHTML={{ __html: rawMode ? htmlLine : stripDirectives(htmlLine) }}
                />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

function renderRendering(r: Rendering, onGotoLocation: (path: string, ln: number) => void): React.ReactNode {
  switch (r.type) {
    case "markdown":
      return <MarkdownView content={r.data} style={r.style} />;
    case "image":
      return <img src={r.data} style={r.style} alt="" />;
    case "video":
      return <video controls style={r.style}><source src={r.data} /></video>;
    case "link":
      if (r.internal_link) {
        const { path, line_number } = r.internal_link;
        return (
          <a href="#" style={r.style} onClick={(e) => { e.preventDefault(); onGotoLocation(path, line_number); }}>
            {r.data ?? `${path}:${line_number}`}
          </a>
        );
      }
      if (r.external_link) {
        return <ExternalLinkCard link={r.external_link} anchorText={r.data} style={r.style} />;
      }
      return null;
    case "plot":
      return <PlotView spec={r.data} style={r.style} />;
    case "note":
      return <div className="note-callout">{r.data}</div>;
    default: {
      const fallback = r as { data?: string; style?: React.CSSProperties };
      return <span style={fallback.style}>{fallback.data}</span>;
    }
  }
}

function stripDirectives(htmlLine: string): string {
  const i = htmlLine.indexOf("#");
  if (i === -1) return htmlLine;
  const code = htmlLine.slice(0, i);
  const comment = htmlLine.slice(i).replace(/@\S+/g, "").replace(/#\s*$/, "");
  return comment.trim() === "" ? code : code + comment;
}
