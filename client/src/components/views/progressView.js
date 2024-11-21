import { faBarsProgress } from "@fortawesome/free-solid-svg-icons";

export const ProgressView = {
  name: "progress",
  label: "Progress",
  icon: faBarsProgress,
  evaluator: (value) => parsePercentage(value) !== null,
  component: ({ data }) => (
    <ProgressBar progress={parsePercentage(data)} />
  )
}

function parsePercentage(value) {
  if (typeof value === 'string') {
    value = value.trim();
    if (value.endsWith('%')) {
      value = value.slice(0, -1);
    }
  }
  value = parseFloat(value);
  if (isNaN(value)) {
    return null;
  }
  if (value >= 0 && value <= 1) {
    value *= 100;
  }
  return parseInt(value);
}

const ProgressBar = ({ progress }) => {
  return (
    <div className="relative px-3">
      <div className="overflow-hidden h-3 mb-1 flex rounded bg-gray-200">
        <div style={{ width: `${progress}%` }} className="shadow-none flex flex-col text-center whitespace-nowrap text-white justify-center bg-green-500"></div>
      </div>
      <div className="flex mb-2 justify-end">
        <span className="text-s font-semibold inline-block text-gray-600">
          {progress}%
        </span>
      </div>
    </div>
  );
};