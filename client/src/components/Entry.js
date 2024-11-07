import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark } from "@fortawesome/free-solid-svg-icons";
import { useState } from "react";
import Views from "./views";


const Entry = ({ data, id, visualization, onDelete }) => {
  const availableViews = Views.filter((view) => view.evaluator(data))
  const initialViewName = availableViews.find((view) => view.name === visualization) ? visualization : availableViews[0].name;
  const [selectedViewName, setSelectedViewName] = useState(initialViewName);
  const View = availableViews.find((view) => view.name === selectedViewName).component;

  return (
    <div className="bg-white border border-gray-200 shadow-md">
      <div className="flex justify-between mt-3 mb-3 px-4">
        <div className="flex gap-2">
          {availableViews.map(({ name, label, icon }) => {
            const className = `text-gray-400 hover:text-gray-500 ${name === selectedViewName ? "text-gray-500" : ""
              }`;
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
        <button
          className="text-gray-400 hover:text-gray-500"
          onClick={() => onDelete()}
          type="button"
        >
          <FontAwesomeIcon icon={faXmark} height="20" width="20" />
        </button>
      </div>
      {<View data={data} />}
    </div>
  );
};
export default Entry;
