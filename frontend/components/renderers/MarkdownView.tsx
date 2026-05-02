import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import remarkGfm from "remark-gfm";
import rehypeKatex from "rehype-katex";
import rehypeExternalLinks from "rehype-external-links";
import "katex/dist/katex.min.css";

interface Props {
  content: string;
  style?: React.CSSProperties;
}

const rehypePlugins = [
  rehypeKatex,
  [rehypeExternalLinks, { target: "_blank", rel: ["noopener", "noreferrer"] }],
] as any;

export function MarkdownView({ content, style }: Props) {
  return (
    <div style={style} className="markdown-content">
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={rehypePlugins}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
