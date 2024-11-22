import { JsonViewer } from "@textea/json-viewer";
import { parseJSON } from "../../utils/dataValidator";
import { faCode } from "@fortawesome/free-solid-svg-icons";
import { isJSONObject, isArrayOfJSONObjects, isArrayOfArrays } from "../../utils/dataValidator";

// view for JSON data
// https://github.com/TexteaInc/json-viewer
export const JsonDataView = {
  name: "json",
  label: "JSON",
  icon: faCode,

  evaluator: (value) => isJSONObject(value) || isArrayOfJSONObjects(value) || isArrayOfArrays(value),
  Component: ({ data }) => (
    <div className="bg-light px-1">
      <JsonViewer value={parseJSON(data)} theme="auto" rootName={false} />
    </div>
  ),

  download: (data) => {
    const json = parseJSON(data);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  },
  search: (data, searchQuery) => {
    const filteredRegExp = new RegExp(searchQuery, 'i'); // Case-insensitive search

    // Recursive matching function
    const matches = (obj) => {
      if (typeof obj === 'string' || typeof obj === 'number') {
        return filteredRegExp.test(String(obj));
      }

      if (Array.isArray(obj)) {
        return obj.some(matches); // Check if any element in the array matches
      }

      if (typeof obj === 'object' && obj !== null) {
        return Object.entries(obj).some(([key, value]) =>
          filteredRegExp.test(key) || matches(value) // Check keys and values
        );
      }

      return false; // Non-matchable types
    };

    if (Array.isArray(data)) {
      // Array handling: Filter objects in the array
      return data.filter((item) => matches(item));
    } else if (typeof data === 'object' && data !== null) {
      // Dictionary handling: Filter keys/values in the object
      const filteredDict = Object.entries(data).reduce((acc, [key, value]) => {
        if (filteredRegExp.test(key) || matches(value)) {
          acc[key] = value;
        }
        return acc;
      }, {});
      return filteredDict;
    }

    // Return data as-is if it's neither an array nor a dictionary
    return data;
  }
}
