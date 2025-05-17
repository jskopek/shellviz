import { faTerminal } from "@fortawesome/free-solid-svg-icons";
import { formatDistanceToNow } from "date-fns";
import { JsonViewer } from "@textea/json-viewer";

function isSimpleObject(obj) {
  return false
  return (
    typeof obj === 'object' &&
    obj !== null &&
    !Array.isArray(obj) &&
    Object.values(obj).every(
      v => typeof v !== 'object' || v === null // Only shallow
    )
  );
}

function InlineJson({ value }) {
  if (Array.isArray(value) && value.length <= 5 && value.every(v => typeof v !== 'object')) {
    return <span>[{value.map((v, i) => <span key={i}>{JSON.stringify(v)}{i < value.length - 1 ? ', ' : ''}</span>)}]</span>;
  }
  if (isSimpleObject(value) && Object.keys(value).length <= 3) {
    return (
      <span>
        {'{'}
        {Object.entries(value).map(([k, v], i, arr) => (
          <span key={k}>
            {k}: {JSON.stringify(v)}{i < arr.length - 1 ? ', ' : ''}
          </span>
        ))}
        {'}'}
      </span>
    );
  }
  // fallback to JsonViewer for complex
  return (
    <span className="inline-block align-top max-w-full">
      <JsonViewer
        value={value}
        theme="auto"
        rootName={false}
        defaultInspectDepth={0}
        displayDataTypes={false}
        enableClipboard={false}
        indentWidth={2}
      />
    </span>
  );
}

const LogValues = ({ values }) => {
  const data = JSON.parse(values);
  return (
    <div className="flex gap-2 break-words">
      {data.map((value, idx) => <LogValue key={idx} value={value} />)}
    </div>
  )
}
const LogValue = ({ value, key }) => {
    if (typeof value === 'number') {
      return <span key={key} className="text-blue-600">{value}</span>;
    } else if (typeof value === 'string') {
      return <span key={key} className="text-gray-900">{value}</span>;
    } else if (typeof value === 'boolean') {
      return <span key={key} className="text-purple-700">{String(value)}</span>;
    } else if (Array.isArray(value) || (typeof value === 'object' && value !== null)) {
      return <InlineJson value={value} />;
    } else if (value === null) {
      return <span key={key} className="text-gray-500">null</span>;
    } else {
      return <span key={key}>{String(value)}</span>;
    }
}

// Renders all values
export const LogView = {
  name: "log",
  label: "Log",
  icon: faTerminal,
  evaluator: (data) =>
    Array.isArray(data) && data.every(
      item => Array.isArray(item) &&
        item.length === 2 &&
        typeof item[0] === 'string' &&
        typeof item[1] === 'number'
    ),
  Component: ({ data }) => {
    if (!Array.isArray(data) || data.length === 0) {
      return null;
    }

    function relativeTime(timestamp) {
      return formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: false });
    }


    return (
      <div className="bg-gray-50 py-2 px-2 font-mono overflow-x-auto text-sm rounded border border-gray-200">
        {data.map(([value, timestamp], idx) => (
          <div key={idx} className="mb-1 flex items-start gap-2 relative group">
            <LogValues key={idx} values={value} />
            <span
              className="absolute right-0 bottom-0 text-xs text-gray-500 whitespace-pre opacity-0 group-hover:opacity-100 transition-opacity bg-gray-50 px-2 py-1"
              title={localDate(timestamp)}
            >
              {relativeTime(timestamp)} ago
            </span>
          </div>
        ))}
      </div>
    );
  },
  search: (data, searchQuery) => {
    const lowerCaseSearch = searchQuery.toLowerCase();
    return data.filter(([value]) => value.toLowerCase().includes(lowerCaseSearch));
  }
};

function localDate(timestamp) {
  // Convert the timestamp from seconds to milliseconds
  const date = new Date(timestamp * 1000);
  // Format the date into a human-readable string
  return date.toLocaleString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: true, // Use 12-hour format
  });
}