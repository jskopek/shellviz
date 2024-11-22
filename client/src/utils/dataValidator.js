const _ = require("underscore");

export const isValid = (data, validatorFunction) =>
  // takes an array of true/false boolean values and return true if every item is true, false otherwise
  _.find(
    _.map(data, validatorFunction),
    (validationResult) => validationResult === false
  ) !== false;

/*
 ************************************************************
 * JSON related functions
 ************************************************************
 */
export const parseJSON = (dataStr) => {
  if (_.isObject(dataStr)) return dataStr;
  try {
    return JSON.parse(dataStr);
  } catch (e) {
    return dataStr
  }
};

export const isValidJson = (json) => {
  if (typeof json === "object" && json !== null) {
    // If it's already an object, it's valid JSON
    return true;
  }

  if (typeof json === "string") {
    try {
      // If it's a string, attempt to parse it as JSON
      const parsed = JSON.parse(json);
      return typeof parsed === "object" && parsed !== null;
    } catch (e) {
      return false;
    }
  }

  // All other types (e.g., numbers, booleans, etc.) are invalid JSON
  return false;
};

export const isJSONObject = (data) => {
  const jsonData = parseJSON(data);
  return _.isObject(jsonData) && !_.isArray(jsonData);
};

export const isArrayOfJSONObjects = (data) => {
  const jsonData = parseJSON(data);
  return _.isArray(jsonData) && _.every(jsonData, (val) => isJSONObject(val));
};

export const isArrayOfArrays = (data) => {
  const jsonData = parseJSON(data);
  return _.isArray(jsonData) && _.every(jsonData, (val) => _.isArray(val));
};

/*
 ************************************************************
 * Object related functions
 ************************************************************
 */
export const isArrayOfObjects = (data) => {
  const jsonData = parseJSON(data);
  return _.isArray(jsonData) && _.every(jsonData, (val) => _.isObject(val));
};

/*
 ************************************************************
 * Other functions
 ************************************************************
 */

export const isArrayOfLabelValuePairs = (data) => {
  const jsonData = parseJSON(data);
  return (
    _.isArray(jsonData) &&
    isValid(jsonData, (val) => val.length === 2 && _.isNumber(val[1]))
  );
};

export function isNumeric(value) {
  if (typeof value === "number" && !isNaN(value)) {
    return true;
  }
  if (typeof value !== "string") {
    return false;
  }
  const regex = /^-?\d+(,\d{3})*(\.\d+)?$/;
  return regex.test(value);
}

/*
 ************************************************************
 * Map Related functions
 ************************************************************
 */

// alternative to lodash clamp
/**
 * Returns a number constrained between two values.
 *
 * @param {number} value - The value to be constrained.
 * @param {number} lowerBound - The lower bound of the range.
 * @param {number} upperBound - The upper bound of the range.
 * @returns {number} - The constrained value.
 */
const clamp = (value, lowerBound, upperBound) =>
  Math.min(Math.max(value, lowerBound), upperBound);

/**
 * Checks if the input data represents a valid strong location.
 * A strong location is an object that has both a valid latitude and a valid longitude value,
 * or a valid latitude value and one of the valid longitude values.
 * Valid longitude values are `long`, `lng`, `lon`.
 *
 * @param {Object} data - The data to check.
 * @returns {Boolean} - True if the input data represents a valid strong location, false otherwise.
 */

export const isValidStrongLocation = (data) =>
  Boolean(
    _.isObject(data) &&
    ((data.latitude &&
      data.longitude &&
      _.isFinite(data.latitude) &&
      _.isFinite(data.longitude)) ||
      (data.lat &&
        _.isFinite(data.lat) &&
        ((data.long && _.isFinite(data.long)) ||
          (data.lng && _.isFinite(data.lng)) ||
          (data.lon && _.isFinite(data.lon)))))
  );

/**
 * Checks if the input data represents a valid weak location.
 * A weak location is an array with 2 finite numbers that represent latitude and longitude, respectively.
 * Latitude values must be between -90 and 90, and longitude values must be between -180 and 180.
 *
 * @param {Array} data - The data to check.
 * @returns {Boolean} - True if the input data represents a valid weak location, false otherwise.
 */

export const isValidWeakLocation = (data) =>
  _.isArray(data) &&
  data.length === 2 &&
  _.every(
    data,
    (coord) =>
      _.isFinite(coord) &&
      clamp(coord, -90, 90) === coord &&
      clamp(coord, -180, 180) === coord
  );

export const isValidLocation = (data) => {
  const jsonData = parseJSON(data);

  // Check if the data is a valid single strong/weak location
  if (isValidStrongLocation(jsonData) || isValidWeakLocation(jsonData)) {
    return true;
  }

  // Check if the data is an array of valid locations
  if (_.isArray(jsonData)) {
    return _.every(jsonData, (location) =>
      isValidStrongLocation(location) || isValidWeakLocation(location)
    );
  }

  return false;
};
/*
 ************************************************************
 * Pie Chart Related functions
 ************************************************************
 */

/*
 Some acceptable data:
  '[["A", 1],["B", 2],["C", 3]]'

  '[{ "name": "A", "value": 1 },{ "name": "B", "value": 2 },{ "name": "C", "value": 3 }]'

  '[{ "A" : 1 },{ "B" : 2 },{ "C" : 3 }]'
  
  '{"A": 1,"B": 2,"C": 3}'
 */

export const isValidPieChartData = (data) => {
  const jsonData = parseJSON(data);
  if (_.isArray(jsonData)) {
    return (
      isValid(
        jsonData,
        (val) =>
          _.isObject(val) &&
          _.values(val).length === 2 &&
          _.isNumber(_.values(val)[1]) // checks if the second value is a number
      ) ||
      isValid(
        jsonData,
        (val) =>
          _.isObject(val) &&
          // eslint-disable-next-line no-shadow
          isValid(_.keys(val), (val) => _.isString(val)) &&
          // eslint-disable-next-line no-shadow
          isValid(_.values(val), (val) => _.isNumber(val))
      )
    );
  }
  return (
    _.keys(jsonData).length > 0 &&
    _.values(jsonData).length > 0 &&
    isValid(_.keys(jsonData), (val) => _.isString(val)) &&
    isValid(_.values(jsonData), (val) => _.isNumber(val))
  );
};

/*
 ************************************************************
 * Grouped Bar Related functions
 ************************************************************
 */

/*
  Acceptable data:
  [
    {
      name: "Jane Doe",
      age: 32,
      score: 20,
      married: true,
      address: { street: "123 Main St", city: "Anytown" },
      phone: "555-555-5555",
    },
    {
      name: "John Doe",
      age: 32,
      score: 23,
      married: true,
      address: { street: "123 Main St", city: "Anytown" },
      phone: "555-555-5555",
    },
    {
      name: "Jimmy Dane",
      age: 28,
      score: 20,
      married: false,
      address: { street: "223 Main St", city: "Worldtown" },
      phone: "555-555-5555",
    },
  ]
*/

export const isValidBarChartData = (data) => {
  const jsonData = parseJSON(data);
  return (
    isArrayOfJSONObjects(jsonData) &&
    _.unique(_.map(data, (item) => _.keys(item).join(","))).length === 1
  );
};

/*
 ************************************************************
 * Area Chart Related functions
 ************************************************************
 */

export const isValidAreaChartData = (data) => {
  const jsonData = parseJSON(data);
  return _.isArray(jsonData) && isValid(jsonData, (val) => _.isNumber(val));
};
