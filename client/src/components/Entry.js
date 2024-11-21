import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faDownload } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Views from "./views";


const Entry = ({ data, id, view: viewName, onDelete }) => {
  const availableViews = Views.filter((view) => view.evaluator(data));
  viewName = availableViews.find((view) => view.name === viewName) ? viewName : availableViews[0].name;
  const [selectedViewName, setSelectedViewName] = useState(viewName);
  const View = availableViews.find((view) => view.name === selectedViewName);
  const ViewComponent = View.component;

  return (
    <div className="bg-white border border-gray-200 shadow-md">
      <div className="flex justify-between mt-3 mb-3 px-4">
        <div className="flex gap-2">
          {availableViews.map(({ name, label, icon }) => {
            const className = `text-gray-400 hover:text-gray-500 ${name === selectedViewName ? "text-gray-500" : ""}`;
            return (
              <button
                key={name}
                className={className}
                onClick={() => setSelectedViewName(name)}
                title={label}
                type="button"
              >
                <FontAwesomeIcon icon={icon} height="20" width="20" />
              </button>
            );
          })}
        </div>
        <div className="flex gap-2">
          {View.download && (
            <button onClick={() => View.download({ data })} className="text-gray-400 hover:text-gray-500" title="Download File">
              <FontAwesomeIcon icon={faDownload} height="20" width="20" />
            </button>
          )}
          <button onClick={() => onDelete()} className="text-gray-400 hover:text-gray-500">
            <FontAwesomeIcon icon={faXmark} height="20" width="20" />
          </button>
        </div>
      </div>
      {<ViewComponent data={data} />}
    </div>
  );
};
export default Entry;
