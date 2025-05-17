export function appendData(existingData, data) {
    /*
    append data to existing data
    */
    if (Array.isArray(existingData) && Array.isArray(data)) {
        return [...existingData, ...data];
    } else if (typeof existingData === 'string' && typeof data === 'string') {
        return existingData + data;
    } else if (typeof existingData === 'object' && typeof data === 'object') {
        return { ...existingData, ...data };
    } else {
        return [existingData, data];
    }
}
export function toJsonSafe(data) {
    /*
    convert data to a json string
    */
    if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data);
    } else {
        return String(data);
    }
}


export function splitArgsAndOptions(args, validOptions) {
    /**
     * Splits a list of arguments into [data, options] for flexible APIs.
     *
     * The last argument is treated as an options object if:
     *   - There is more than one argument,
     *   - The last argument is a plain object (not null, not an array),
     *   - All keys in the object are in the valid options list,
     *   - At least one key in the object is in the valid options list.
     *
     * Otherwise, all arguments are treated as data, and options is an empty object.
     *
     * @param {Array} args - The arguments passed to the function.
     * @param {Array<string>} validOptions - List of valid option keys.
     * @returns {[Array, Object]} - [data arguments as array, options object]
     * @example
     * // With valid options object as last argument:
     * splitArgsAndOptions(['a', 'b', {id: 1}], ['id', 'level'])
     * // => [['a', 'b'], {id: 1}]
     *
     * // With options object containing both valid keys:
     * splitArgsAndOptions(['a', {id: 1, level: 'info'}], ['id', 'level'])
     * // => [['a'], {id: 1, level: 'info'}]
     *
     * // With object as last argument, but with an invalid key:
     * splitArgsAndOptions(['a', {foo: 1}], ['id', 'level'])
     * // => [['a', {foo: 1}], {}]
     *
     * // With only one argument (object), treated as data:
     * splitArgsAndOptions([{id: 1}], ['id', 'level'])
     * // => [[{id: 1}], {}]
     *
     * // With no options object:
     * splitArgsAndOptions(['a', 'b'], ['id', 'level'])
     * // => [['a', 'b'], {}]
     *
     * // With object as last argument, with some valid and some invalid keys:
     * splitArgsAndOptions(['a', {id: 1, name: 'John'}], ['id', 'level'])
     * // => [['a', {id: 1, name: 'John'}], {}]
     */
    const potentialOptions = args[args.length - 1];
    if (
        args.length > 1 &&
        typeof potentialOptions === 'object' &&
        potentialOptions !== null &&
        !Array.isArray(potentialOptions)
    ) {
        const keys = Object.keys(potentialOptions);
        const hasValidOption = keys.some(k => validOptions.includes(k));
        const allKeysValid = keys.every(k => validOptions.includes(k));
        if (hasValidOption && allKeysValid) {
            const options = potentialOptions;
            return [args.slice(0, -1), options];
        }
    }
    return [args, {}];
}