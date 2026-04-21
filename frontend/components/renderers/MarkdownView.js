import { jsx as _jsx } from "react/jsx-runtime";
import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";
export function MarkdownView({ content, style }) {
    return (_jsx(ReactMarkdown, { remarkPlugins: [remarkMath], rehypePlugins: [rehypeKatex], components: {
            p: ({ children }) => _jsx("span", { style: style, children: children }),
        }, children: content }));
}
