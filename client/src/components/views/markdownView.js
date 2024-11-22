import ReactMarkdown from "react-markdown";
import { faFileWord } from "@fortawesome/free-solid-svg-icons";

export const MarkdownView =
{
  name: "markdown",
  label: "Markdown",
  icon: faFileWord,
  evaluator: (value) => typeof value == 'string',
    <ReactMarkdown className="bg-gray-200 font-mono p-4 rounded-md whitespace-pre overflow-x-auto ">
  Component: ({ data }) => (
      {data}
    </ReactMarkdown>
  )
}

