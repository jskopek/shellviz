import os from 'os';
import { getStackTrace as getStackTraceBase } from './utils.js';

/**
 * Returns an array of stack frames with function, filename, lineno, code (if available), and locals (only for the top frame, if provided).
 * @param {Object} [locals] - (optional) Locals for the current frame.
 * @param {Object} [options] - Optional overrides for fileFilter/readSourceLine.
 * @returns {Array<Object>} Stack frames with function, filename, lineno, code, and locals (top frame only).
 */
export function getStackTrace(locals = null) {
    return getStackTraceBase(locals, {
        fileFilter: (file) => (
            typeof file === 'string' &&
            file.startsWith(process && process.cwd ? process.cwd().replace(/\\/g, '/') + '/' : '') &&
            !file.includes('node_modules') &&
            !file.includes('shellviz/libraries/js/src') &&
            !file.startsWith('node:')
        ),
        readSourceLine: (file, lineno) => {
            try {
                if (file && lineno && fs.existsSync(file)) {
                    const srcLines = fs.readFileSync(file, 'utf8').split('\n');
                    if (lineno > 0 && lineno <= srcLines.length) {
                        return srcLines[lineno - 1].trim();
                    }
                }
            } catch (e) { }
            return null;
        }
    });
}

export function getLocalIp() {
    /*
    get the local ip address from the network interfaces
    */
    const interfaces = os.networkInterfaces();
    for (const name of Object.keys(interfaces)) {
        for (const iface of interfaces[name]) {
            // Skip internal and non-IPv4 addresses
            if (iface.internal || iface.family !== 'IPv4') continue;
            return iface.address;
        }
    }
    return '127.0.0.1'; // Fallback to localhost
}
