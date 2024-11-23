import { faTerminal } from "@fortawesome/free-solid-svg-icons";
import { formatDistanceToNow } from "date-fns";

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
    if (!Array.isArray(data)) {
      return null;
    }

    const now = Date.now() / 1000; // Current time in seconds
    const formattedData = data.map(([value, timestamp]) => {
      const relativeTime = formatDistanceToNow(new Date(timestamp * 1000), { addSuffix: false });
      return { value, relativeTime, timestamp };
    });

    return (
      <div className="bg-gray-50 py-2 px-2 font-mono overflow-x-auto">
        {formattedData.map(({ value, relativeTime, timestamp }, index) => (
          <div key={index} className="py-1 border-b last:border-none flex justify-between items-center text-sm">
            <span>{value}</span>
            <span className="text-xs text-gray-500 whitespace-pre" title={localDate(timestamp)}>{relativeTime}</span>
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