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
  component: ({ data }) => (
    <div className="bg-black">
      <JsonViewer value={parseJSON(data)} theme="auto" rootName={false} />
    </div>
  )
}