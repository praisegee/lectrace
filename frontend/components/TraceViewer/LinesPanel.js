import { jsx as _jsx, jsxs as _jsxs } from "react/jsx-runtime";
import { useMemo, useCallback } from "react";
import hljs from "highlight.js/lib/core";
import python from "highlight.js/lib/languages/python";
import "highlight.js/styles/github.css";
import { computeLinesToShow } from "../../hooks/useNavigation";
import { MarkdownView } from "../renderers/MarkdownView";
import { ExternalLinkCard } from "../renderers/ExternalLinkCard";
import { PlotView } from "../renderers/PlotView";
hljs.registerLanguage("python", python);
export function LinesPanel({ trace, path, lineNumber, stepIndex, rawMode, animateMode, showNotes, onGotoLine, onGotoLocation, }) {
    const fileContents = trace.files[path] ?? "";
    const highlightedLines = useMemo(() => {
        const highlighted = hljs.highlight(fileContents, { language: "python" }).value;
        return highlighted.split("\n");
    }, [fileContents]);
    const linesToShow = useMemo(() => computeLinesToShow(trace, stepIndex), [trace, stepIndex]);
    const lineToRenderings = useMemo(() => {
        const map = new Map();
        for (const step of trace.steps) {
            const frame = step.stack.at(-1);
            if (frame)
                map.set(frame.line_number, step.renderings);
        }
        return map;
    }, [trace.steps]);
    const hidden = new Set(trace.hidden_line_numbers[path] ?? []);
    const scrollRef = useCallback((el) => {
        if (!el)
            return;
        const rect = el.getBoundingClientRect();
        const inView = rect.top >= 50 && rect.bottom <= window.innerHeight - 50;
        if (!inView) {
            const dist = Math.min(Math.abs(rect.top), Math.abs(rect.bottom - window.innerHeight));
            el.scrollIntoView({ behavior: dist < 150 ? "smooth" : "instant", block: "center" });
        }
    }, []);
    return (_jsx("div", { className: "lines-panel", children: highlightedLines.map((htmlLine, idx) => {
            const ln = idx + 1;
            if (hidden.has(ln))
                return null;
            const loc = `${path}:${ln}`;
            const isCurrent = ln === lineNumber;
            const cloaked = animateMode && !linesToShow.has(loc);
            const allRenderings = lineToRenderings.get(ln) ?? [];
            const renderings = allRenderings.filter((r) => r.type !== "note");
            const notes = allRenderings.filter((r) => r.type === "note");
            return (_jsxs("div", { ref: isCurrent ? scrollRef : null, className: ["line", isCurrent ? "current-line" : "", cloaked ? "cloaked" : ""].filter(Boolean).join(" "), children: [_jsx("span", { className: "line-number", onClick: () => onGotoLine(ln), title: `Go to line ${ln}`, children: ln }), !rawMode && renderings.length > 0 ? (_jsxs("span", { className: "renderings", children: [_jsx("span", { className: "indent", dangerouslySetInnerHTML: { __html: htmlLine.match(/^(\s*)/)?.[0] ?? "" } }), renderings.map((r, i) => (_jsx("span", { children: renderRendering(r, onGotoLocation) }, i)))] })) : (_jsx("span", { className: "code-line", dangerouslySetInnerHTML: { __html: rawMode ? htmlLine : stripDirectives(htmlLine) } })), showNotes && notes.map((r, i) => (_jsx("span", { className: "note-text", children: r.data }, i)))] }, ln));
        }) }));
}
function renderRendering(r, onGotoLocation) {
    switch (r.type) {
        case "markdown":
            return _jsx(MarkdownView, { content: r.data, style: r.style });
        case "image":
            return _jsx("img", { src: r.data, style: r.style, alt: "" });
        case "video":
            return _jsx("video", { controls: true, style: r.style, children: _jsx("source", { src: r.data }) });
        case "link":
            if (r.internal_link) {
                const { path, line_number } = r.internal_link;
                return (_jsx("a", { href: "#", style: r.style, onClick: (e) => { e.preventDefault(); onGotoLocation(path, line_number); }, children: r.data ?? `${path}:${line_number}` }));
            }
            if (r.external_link) {
                return _jsx(ExternalLinkCard, { link: r.external_link, anchorText: r.data, style: r.style });
            }
            return null;
        case "plot":
            return _jsx(PlotView, { spec: r.data, style: r.style });
        default: {
            const fallback = r;
            return _jsx("span", { style: fallback.style, children: fallback.data });
        }
    }
}
function stripDirectives(htmlLine) {
    const i = htmlLine.indexOf("#");
    if (i === -1)
        return htmlLine;
    const code = htmlLine.slice(0, i);
    const comment = htmlLine.slice(i).replace(/@\S+/g, "").replace(/#\s*$/, "");
    return comment.trim() === "" ? code : code + comment;
}
