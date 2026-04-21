import ReactMarkdown from "react-markdown";
import remarkMath from "remark-math";
import rehypeKatex from "rehype-katex";
import "katex/dist/katex.min.css";

interface Props {
  content: string;
  style?: React.CSSProperties;
}

export function MarkdownView({ content, style }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkMath]}
      rehypePlugins={[rehypeKatex]}
      components={{
        p: ({ children }) => <span style={style}>{children}</span>,
      }}
    >
      {content}
    </ReactMarkdown>
  );
}
