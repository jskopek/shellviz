import _ from "underscore";

/**
Parses JSON data to extract latitude and longitude coordinates.
@param {string} data - The JSON data to be parsed.
@returns {number[]} An array containing latitude and longitude values.
@example
const data = '{"latitude": 37.7749, "longitude": -122.4194}';
const coordinates = getCoordinates(data); // returns [37.7749, -122.4194]
*/
export const getCoordinates = (data) => {
  let latitude = _.get(data, "latitude", _.get(data, "lat"));
  let longitude = _.get(
    data,
    ["longitude"],
    _.get(
      data,
      ["long"],
      _.get(data, ["lng"], _.get(data, ["lon"]))
    )
  );

  if (_.isArray(data) && data.length === 2) {
    [latitude, longitude] = data;
  }

  return [latitude, longitude];
};

/**
 * Returns an array of objects in the format required by Nivo Pie chart from the input data.
 * @param {Array|Object} data - The input data to be filtered and transformed.
 * @returns {Array} An array of objects with "id" and "value" properties.
 * @example
 * const data = [
 *   { name: "A", value: 1 },
 *   { name: "B", value: 2 },
 *   { name: "C", value: 3 },
 *   { name: "D", value: "invalid" },
 * ];
 * const pieData = getPieChartData(data);
 * console.log(pieData); // Output: [{ id: "A", value: 1 }, { id: "B", value: 2 }, { id: "C", value: 3 }]
 */
export const getPieChartData = (data) => {
  // Initialize an empty array to hold the filtered data
  const pieData = [];

  if (_.isArray(data)) {
    _.each(data, (item) => {
      // If the item is an array with length 2 and the first element is a string and the second element is a number...
      if (
        _.isArray(item) &&
        item.length === 2 &&
        _.isString(item[0]) &&
        _.isNumber(item[1])
      ) {
        pieData.push({
          id: item[0],
          value: item[1],
        });
      } else if (
        _.isObject(item) &&
        _.has(item, "name") &&
        _.has(item, "value") &&
        _.isString(item.name) &&
        _.isNumber(item.value)
      ) {
        pieData.push({
          id: item.name,
          value: item.value,
        });
      } else if (_.isObject(item) && _.isNumber(_.values(item)[0])) {
        pieData.push({
          id: _.keys(item)[0],
          value: _.values(item)[0],
        });
      }
    });
  } else if (_.isObject(data)) {
    // Loop through each key-value pair in the object
    _.each(data, (value, key) => {
      // If the value is a number...
      if (_.isNumber(value)) {
        // Push an object with the id and value properties to the pieData array
        pieData.push({
          id: key,
          value,
        });
      }
    });
  }

  // Return the filtered data as an array of objects with the id and value properties
  return pieData;
};

/**
 * Retrieves the data needed to render a grouped bar chart from a JSON string.
 * @param {string} data - The JSON string containing the data to parse.
 * @param {string} [key] - The key to use for grouping the data. If not provided, the first numeric or boolean key found in the data will be used.
 * @return {[string[], string[], object[]]} An array containing three elements:
 *  - An array of all the numeric or boolean keys found in the data.
 *  - An array of all the keys that were used to group the data.
 *  - An array of objects containing the grouped data in the format: { [currentKey]: groupKey, [groupKey]: value }
 */

// to return all keys
const getAllAggregationKeys = (data) => {
  const keys = _.chain(data).map(_.keys).flatten().uniq().value();
  const numericOrBooleanKeys = _.filter(keys, (key) => {
    const values = _.map(data, key);
    return _.every(values, (value) => _.isNumber(value) || _.isBoolean(value));
  });
  return numericOrBooleanKeys;
};

export const getBarChartData = (data, key) => {
  const aggregationKeys = getAllAggregationKeys(data);
  const currentKey = key || aggregationKeys[0];

  const groupedData = _.countBy(_.pluck(data, currentKey));
  const groupedKeys = _.keys(groupedData);
  const barChartData = _.map(groupedData, (value, groupKey) => ({
    [currentKey]: groupKey,
    [groupKey]: value,
  }));

  return [aggregationKeys, groupedKeys, barChartData];
};

/**
 * Converts a a simple array into an array of objects with x and y properties, suitable for rendering an area chart.
 * @param {string} data - The JSON string containing the data to parse.
 * @returns {object[]} An array of objects with x and y properties.
 * @example
 *
 * Example usage:
 * const data = '[2, 35, 64, 8]';
 * const areaChartData = getAreaChartData(data);
 * console.log(areaChartData);
 * Output: [
      {
        id: "data",
        data: [
          { x: 0, y: 2 },
          { x: 1, y: 35 },
          { x: 2, y: 64 },
          { x: 3, y: 8 },
        ],
      },
    ];
 */

export const getAreaChartData = (data) => {
  const areaChartFormattedData = [
    {
      id: "data", // id is the name of the series which in our case it doesn't matter
      data: _.map(data, (value, key) => ({ x: key, y: value })), // data is an array of objects with x (as the index of the array) and y properties
    },
  ];
  return areaChartFormattedData;
};
