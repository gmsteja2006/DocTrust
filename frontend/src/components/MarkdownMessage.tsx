import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { useTheme } from "../hooks/useTheme";

interface MarkdownMessageProps {
  content: string;
}

export function MarkdownMessage({ content }: MarkdownMessageProps) {
  const { theme } = useTheme();
  const isLight = theme === "light";

  const textColor = isLight ? "text-slate-800" : "text-gray-200";
  const strongColor = isLight ? "text-slate-900" : "text-white";
  const emColor = isLight ? "text-slate-600" : "text-gray-300";
  const liColor = isLight ? "text-slate-700" : "text-gray-200";
  const tableBorder = isLight ? "border-slate-200" : "border-gray-700";
  const theadBg = isLight ? "bg-slate-100 text-slate-600" : "bg-gray-800/80 text-gray-300";
  const trBorder = isLight ? "border-slate-200/70" : "border-gray-700/50";
  const thColor = isLight ? "text-slate-700" : "text-gray-200";
  const tdColor = isLight ? "text-slate-600" : "text-gray-300";
  const codeBg = isLight ? "bg-slate-200/70" : "bg-black/30";
  const inlineCodeColor = isLight ? "text-violet-700" : "text-violet-300";
  const blockCodeColor = isLight ? "text-slate-700" : "text-gray-300";
  const headingColor = isLight ? "text-slate-900" : "text-white";
  const blockquoteBorder = "border-violet-500";
  const blockquoteText = isLight ? "text-slate-500" : "text-gray-400";
  const preBg = isLight ? "bg-slate-100" : "bg-black/30";

  return (
    <div className={`prose-sm max-w-none ${isLight ? "prose" : "prose-invert"}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          p: ({ children }) => (
            <p className={`mb-2 last:mb-0 ${textColor}`}>{children}</p>
          ),
          strong: ({ children }) => (
            <strong className={`font-semibold ${strongColor}`}>{children}</strong>
          ),
          em: ({ children }) => <em className={emColor}>{children}</em>,
          ol: ({ children }) => (
            <ol className="my-2 ml-4 list-decimal space-y-1">{children}</ol>
          ),
          ul: ({ children }) => (
            <ul className="my-2 ml-4 list-disc space-y-1">{children}</ul>
          ),
          li: ({ children }) => <li className={liColor}>{children}</li>,
          table: ({ children }) => (
            <div className={`my-3 overflow-x-auto rounded-lg border ${tableBorder}`}>
              <table className="w-full border-collapse text-xs">{children}</table>
            </div>
          ),
          thead: ({ children }) => (
            <thead className={theadBg}>{children}</thead>
          ),
          tbody: ({ children }) => <tbody>{children}</tbody>,
          tr: ({ children }) => (
            <tr className={`border-b last:border-b-0 ${trBorder}`}>{children}</tr>
          ),
          th: ({ children }) => (
            <th className={`px-3 py-2 text-left font-semibold whitespace-nowrap ${thColor}`}>
              {children}
            </th>
          ),
          td: ({ children }) => (
            <td className={`px-3 py-2 whitespace-nowrap ${tdColor}`}>{children}</td>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes("language-");
            if (isBlock) {
              return (
                <pre className={`my-2 overflow-x-auto rounded-md p-3 ${preBg}`}>
                  <code className={`text-xs ${blockCodeColor}`}>{children}</code>
                </pre>
              );
            }
            return (
              <code className={`rounded px-1.5 py-0.5 text-xs ${codeBg} ${inlineCodeColor}`}>
                {children}
              </code>
            );
          },
          pre: ({ children }) => <>{children}</>,
          h1: ({ children }) => (
            <h1 className={`mb-2 mt-3 text-base font-bold ${headingColor}`}>{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className={`mb-2 mt-3 text-sm font-bold ${headingColor}`}>{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className={`mb-1 mt-2 text-sm font-semibold ${headingColor}`}>{children}</h3>
          ),
          blockquote: ({ children }) => (
            <blockquote className={`my-2 border-l-2 pl-3 ${blockquoteBorder} ${blockquoteText}`}>
              {children}
            </blockquote>
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
