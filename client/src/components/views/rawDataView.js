import { faFile } from "@fortawesome/free-solid-svg-icons";

// Renders all values
export const RawDataView = {
  name: "raw",
  label: "Raw Data",
  icon: faFile,
  evaluator: () => true,
  Component: ({ data }) => {
    if (typeof data !== 'string') {
      data = JSON.stringify(data, null, 2);
    }
    return (
      <p className="bg-gray-100 py-2 px-2 font-mono whitespace-pre overflow-x-auto">
        {data}
      </p>
    );
  },
}