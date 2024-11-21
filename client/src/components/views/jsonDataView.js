import { JsonViewer } from "@textea/json-viewer";
import { parseJSON } from "../../utils/dataValidator";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCode, faDownload } from "@fortawesome/free-solid-svg-icons";
import { isJSONObject, isArrayOfJSONObjects, isArrayOfArrays } from "../../utils/dataValidator";

// view for JSON data
// https://github.com/TexteaInc/json-viewer
export const JsonDataView = {
  name: "json",
  label: "JSON",
  icon: faCode,
  
  evaluator: (value) => isJSONObject(value) || isArrayOfJSONObjects(value) || isArrayOfArrays(value),
  component: ({ data }) => (
    <div className="bg-light px-1">
      <JsonViewer value={parseJSON(data)} theme="auto" rootName={false} />
    </div>
  ),

  download: ({ data }) => {
    const json = parseJSON(data);
    const blob = new Blob([JSON.stringify(json, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "data.json";
    a.click();
    URL.revokeObjectURL(url);
  },
}
