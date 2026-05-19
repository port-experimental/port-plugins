import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

type Props = {
  body: string;
};

export function MarkdownBody({ body }: Props) {
  return (
    <ReactMarkdown
      remarkPlugins={[remarkGfm]}
      components={{
        a: ({ href, children }) => (
          <a href={href} target="_blank" rel="noopener noreferrer">
            {children}
          </a>
        ),
        code: ({ className, children }) => {
          const isBlock = className?.includes("language-");
          if (isBlock) {
            return (
              <pre className="code-block">
                <code>{children}</code>
              </pre>
            );
          }
          return <code className="inline-code">{children}</code>;
        },
        pre: ({ children }) => <>{children}</>,
      }}
    >
      {body}
    </ReactMarkdown>
  );
}
