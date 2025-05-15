const os = require('os');

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
