/* eslint-disable react-hooks/rules-of-hooks */
import _ from "underscore";
import csvDownload from "json-to-csv-export";
import { isJSONObject, isValidJson, isArrayOfArrays, isArrayOfJSONObjects } from "../../utils/dataValidator";
import { useState } from "react";
import { faTableList } from "@fortawesome/free-solid-svg-icons";

export const TableView = {
  name: "table",
  label: "Table",
  icon: faTableList,
  evaluator: (value) => isArrayOfJSONObjects(value) || isArrayOfArrays(value) || isJSONObject(value),
  Component: ({ data }) => {
    if (isJSONObject(data)) {
      // if data is an object, convert it to an array of key-value pairs
      data = Object.entries(data).map(([key, value]) => ({ key, value }));
    }

    const [sortBy, setSortBy] = useState(undefined);
    const [sortByReverse, setSortByReverse] = useState(false);
    if (sortBy) {
      data = _.sortBy(data, [sortBy])
      if (sortByReverse) {
        data = data.reverse()
      }
    }



    const headers = _.keys(_.first(data));

    // Create an array of rows, where each row is an array of cells.
    // The values in each cell are either converted to a JSON string (if they're an object) or left as is.
    // This is done to ensure that the table can display all types of data, including nested JSON objects.
    let rows = _.map(data, (row) =>
      _.map(_.values(row), (cell) =>
        isValidJson(cell) ? JSON.stringify(cell) : cell
      )
    );


    return (
        <div className="min-w-full py-2 align-middle overflow-x-auto max-w-full">
            <table className="min-w-full divide-y divide-gray-300 font-mono rounded-md whitespace-pre relative">
              <thead>
                <tr>
                  {headers.map((header) => (
                    <th
                      key={header}
                      scope="col"
                      className="pb-1 px-3 text-left text-sm font-semibold text-gray-900 uppercase cursor-pointer"
                      onClick={() => sortBy === header ? setSortByReverse(!sortByReverse) : setSortBy(header)}
                    >
                      {header}
                      {sortBy === header ? (sortByReverse ? ' ▼' : ' ▲') : ''}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-300">
                {rows.map((row, index) => (
                  <tr
                    // eslint-disable-next-line react/no-array-index-key
                    key={index}
                    className="divide-x divide-gray-300"
                  >
                    {row.map((cell, cellIndex) => (
                      <td
                        // eslint-disable-next-line react/no-array-index-key
                        key={cellIndex}
                        className="whitespace-nowrap py-1 px-3 text-sm font-medium text-gray-900"
                      >
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
    );
  },
  download: (data) => {
    csvDownload({ data });
  },
  search: (data, searchQuery) => {
    const filteredRegExp = new RegExp(searchQuery, 'i');
    return _.filter(data, (dict) => _.values(dict).join(' ').match(filteredRegExp));
  }
}
