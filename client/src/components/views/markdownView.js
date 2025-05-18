import ReactMarkdown from "react-markdown";
import { faFileWord } from "@fortawesome/free-solid-svg-icons";
import remarkGfm from "remark-gfm";
import rehypeRaw from "rehype-raw";

export const MarkdownView = {
  name: "markdown",
  label: "Markdown",
  icon: faFileWord,
  evaluator: (value) => typeof value == 'string',
  Component: ({ data }) => (
    <ReactMarkdown
      className="bg-gray-200 font-mono p-4 rounded-md overflow-x-auto"
      remarkPlugins={[remarkGfm]}
      rehypePlugins={[rehypeRaw]}
      components={{
        h1: ({ node, children, ...props }) => ( <h1 className="text-3xl font-bold mt-6 mb-4" {...props}>{children}</h1>),
        h2: ({ node, children, ...props }) => ( <h2 className="text-2xl font-semibold mt-5 mb-3" {...props}>{children}</h2>),
        h3: ({ node, children, ...props }) => ( <h3 className="text-xl font-medium mt-4 mb-2" {...props}>{children}</h3>),
        p: ({ node, ...props }) => ( <p className="text-base leading-6 mb-3" {...props} />),
        ul: ({ node, ...props }) => ( <ul className="list-disc list-inside ml-4 mb-3" {...props} />),
        ol: ({ node, ...props }) => ( <ol className="list-decimal list-inside ml-4 mb-3" {...props} />),
        blockquote: ({ node, ...props }) => ( <blockquote className="border-l-4 border-gray-400 pl-4 italic text-gray-600 my-4" {...props} />),
      }}
    >
      {data}
    </ReactMarkdown>
  ),
};