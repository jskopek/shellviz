import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faAngleDoubleLeft, faAngleDoubleRight, faAngleLeft, faAngleRight, faColumns } from "@fortawesome/free-solid-svg-icons";
import { useState, useEffect, useMemo } from "react";
import { isJSONObject, isArrayOfJSONObjects, isArrayOfArrays, isValidJson } from "../../utils/dataValidator";
import _ from "lodash";

export const CardView = {
    name: "card",
    label: "Card",
    icon: faColumns,

    evaluator: (value) => isJSONObject(value) || isArrayOfJSONObjects(value) || isArrayOfArrays(value),
    Component: ({ data }) => {
        if (!_.isArray(data)) {
            data = [data];
        }

        const numCards = data.length;

        const [index, setIndex] = useState(0);
        useEffect(() => {
            if(index > data.length - 1) {
                setIndex(data.length ? data.length - 1 : 0);
            }
        }, [data, index])

        const row = data[index];

        // Generate key-value pairs
        // The values in each cell are either converted to a JSON string (if they're an object) or left as is.
        // This is done to ensure that the table can display all types of data, including nested JSON objects.
        const values = useMemo(() => _.toPairs(_.mapValues(row, (value) => isValidJson(value) ? JSON.stringify(value) : value)), [row]);



        return (
            <div className="font-mono whitespace-pre overflow-y-auto">
            <table className="table-auto w-full divide-y divide-gray-300">
                {values.map((value, i) => (
                <tr key={i}>
                    {/* First column adjusts to the widest content */}
                    <th className="text-sm font-semibold text-gray-900 text-end uppercase px-3 whitespace-nowrap">
                    {value[0]}
                    </th>
                    {/* Second column takes the remaining space */}
                    <td className="py-1 px-3 text-sm font-medium text-gray-900 w-full">
                    {value[1] ? value[1] : '-'}
                    </td>
                </tr>
                ))}
            </table>

            <div className="flex items-center justify-center mt-2 mb-2 text-gray-400">
                <button onClick={() => setIndex(0)} className="px-2 rounded hover:bg-gray-300">
                    <FontAwesomeIcon icon={faAngleDoubleLeft} />
                </button>
                <button onClick={() => setIndex(Math.max(0, index - 1))} className="px-2 rounded hover:bg-gray-300">
                    <FontAwesomeIcon icon={faAngleLeft} />
                </button>
                <span className="text-sm font-medium mx-2 text-gray-900">{index + 1} of {numCards}</span>
                <button onClick={() => setIndex(Math.min(numCards - 1, index + 1))} className="px-2 rounded hover:bg-gray-300">
                    <FontAwesomeIcon icon={faAngleRight} />
                </button>
                <button onClick={() => setIndex(numCards - 1)} className="px-2 rounded hover:bg-gray-300">
                    <FontAwesomeIcon icon={faAngleDoubleRight} />
                </button>
            </div>
            </div>
        );
    },
    search: (data, searchQuery) => {
        const filteredRegExp = new RegExp(searchQuery, 'i');
        return _.filter(data, (dict) => _.values(dict).join(' ').match(filteredRegExp));
    }
};