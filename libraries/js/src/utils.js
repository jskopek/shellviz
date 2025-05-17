function appendData(existingData, data) {
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
function toJsonSafe(data) {
    /*
    convert data to a json string
    */
    if (typeof data === 'object' && data !== null) {
        return JSON.stringify(data);
    } else {
        return String(data);
    }
}


function splitArgsAndOptions(args, validOptions) {
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

function getStackTrace(locals = null, options = {}) {
    /**
     * Returns an array of stack frames with function, filename, lineno, code (if available), and locals (only for the top frame, if provided).
     * Portable version: no Node dependencies, includes all frames and does not attempt to read code lines.
     *
     * @param {Object} [locals] - (optional) Locals for the current frame.
     * @param {Object} [options] - Optional hooks: fileFilter(file), readSourceLine(file, lineno)
     * @returns {Array<Object>} Stack frames with function, filename, lineno, code, and locals (top frame only).
     */
    const stack = (new Error()).stack || '';
    const lines = stack.split('\n').slice(1); // skip the Error line
    const frames = [];
    const defaultFileFilter = () => true;
    const defaultReadSourceLine = () => null;
    const fileFilter = options.fileFilter || defaultFileFilter;
    const readSourceLine = options.readSourceLine || defaultReadSourceLine;
    for (let i = 0; i < lines.length; i++) {
        const line = lines[i].trim();
        // Example: at FunctionName (filename.js:10:15)
        // or: at filename.js:10:15
        const match = line.match(/^at (.+?) \((.+?):(\d+):(\d+)\)$/) ||
                      line.match(/^at (.+?):(\d+):(\d+)$/);
        let fn, file, lineno;
        if (match) {
            if (match.length === 5) {
                fn = match[1];
                file = match[2];
                lineno = parseInt(match[3], 10);
            } else if (match.length === 4) {
                fn = '<anonymous>';
                file = match[1];
                lineno = parseInt(match[2], 10);
            }
        } else {
            fn = '<unknown>';
            file = '<unknown>';
            lineno = null;
        }
        if (fileFilter(file)) {
            let code = readSourceLine(file, lineno);
            let localsObj = {};
            if (frames.length === 0) {
                if (locals && typeof locals === 'object') {
                    localsObj = {};
                    for (const [k, v] of Object.entries(locals)) {
                        try {
                            localsObj[k] = JSON.stringify(v);
                        } catch {
                            localsObj[k] = String(v);
                        }
                    }
                } else if (locals !== null && locals !== undefined) {
                    localsObj = { value: String(locals) };
                } else {
                    localsObj = {};
                }
            }
            frames.unshift({
                function: fn,
                filename: file,
                lineno: lineno,
                code: code,
                locals: localsObj
            });
        }
    }
    return frames;
}

module.exports = {
  appendData,
  toJsonSafe,
  splitArgsAndOptions,
  getStackTrace
};