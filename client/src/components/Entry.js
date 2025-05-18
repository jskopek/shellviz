import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faXmark, faDownload, faSearch } from "@fortawesome/free-solid-svg-icons";
import { useState, useRef, useEffect } from "react";
import Views from "./views";


const Entry = ({ data, id, view: viewName, onDelete }) => {
  const availableViews = Views.filter((view) => view.evaluator(data));
  viewName = availableViews.find((view) => view.name === viewName) ? viewName : availableViews[0].name;

  const [selectedViewName, setSelectedViewName] = useState(viewName);
  const View = availableViews.find((view) => view.name === selectedViewName);

  const [showAllViews, setShowAllViews] = useState(false);
  const [expanded, setExpanded] = useState(true);

  const [showSearch, setShowSearch] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const searchInputRef = useRef(null);
  const [filteredData, setFilteredData] = useState(data);
  useEffect(() => { setFilteredData(View.search ? View.search(data, searchQuery) : data); }, [data, searchQuery, View]);

  return (
    <div className="border border-gray-200 shadow-md">
      {/* header */}
      <div className="sticky top-0 bg-white z-10 py-3">
        <div className="flex justify-between px-4">
          {/* view selection */}
          <div
            className="flex gap-2 relative overflow-hidden rounded-md hover:bg-gray-100 p-2"
            onMouseEnter={() => setShowAllViews(true)}
            onMouseLeave={() => setShowAllViews(false)}
          >
            <div className="flex gap-2">
              {availableViews.map(({ name, label, icon }) => {
                const isSelected = name === selectedViewName;
                const shouldDisplay = isSelected || showAllViews;
                const className = `text-gray-400 hover:text-gray-500 ${isSelected ? "text-gray-500" : ""}`;

                return (
                  <button
                    key={name}
                    className={className}
                    onClick={() => setSelectedViewName(name)}
                    title={label}
                    type="button"
                    style={{
                      display: shouldDisplay ? "inline-flex" : "none",
                    }}
                  >
                    <FontAwesomeIcon icon={icon} height="20" width="20" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* expand/collapse button */}
          <div className="flex grow cursor-pointer" onClick={() => setExpanded(!expanded)} />

          {/* download, search, and delete buttons */}
          <div className="flex gap-2 items-center">
            {View.download && (
              <button onClick={() => View.download(View.search ? filteredData : data)} className="text-gray-400 hover:text-gray-500" title="Download File">
                <FontAwesomeIcon icon={faDownload} height="20" width="20" />
              </button>
            )}
            {View.search && (
              <div>

                {showSearch ? (
                  <input
                    type="text"
                    ref={searchInputRef}
                    className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring focus:ring-gray-200 search-input"
                    placeholder="Search"
                    value={searchQuery}
                    onChange={(e) => { setSearchQuery(e.target.value); }}
                    onBlur={() => { if (!searchQuery) setShowSearch(false) }}
                  />) : (
                  <button
                    onClick={() => {
                      setShowSearch(true);
                      // focus the input element
                      setTimeout(() => { searchInputRef.current?.focus() });
                    }
                    }
                    className="text-gray-400 hover:text-gray-500"
                    title="Search"
                  >
                    <FontAwesomeIcon icon={faSearch} height="20" width="20" />
                  </button>
                )}
              </div>
            )}

            <button onClick={() => onDelete()} className="text-gray-400 hover:text-gray-500">
              <FontAwesomeIcon icon={faXmark} height="20" width="20" />
            </button>
          </div>
        </div>
      </div>

      {/* view */}
      {expanded && <View.Component data={View.search ? filteredData : data} />}
    </div>
  );
};
export default Entry;
