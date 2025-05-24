// config.js
// Cross-platform configuration for Node.js and browser environments

function _strToBool(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'boolean') return value;
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true' || value === '1' || value.toLowerCase() === 'yes';
  }
  return null;
}

function _strToInt(value) {
  if (value === null || value === undefined) return null;
  if (typeof value === 'number') return value;
  const parsed = parseInt(value, 10);
  return isNaN(parsed) ? null : parsed;
}

function _getConfigValue(key, converter) {
  // Try process.env first (Node.js environment)
  if (typeof process !== 'undefined' && process.env && process.env[key] !== undefined) {
    const value = process.env[key];
    return converter ? converter(value) : value;
  }
  
  // Try window object (browser environment)
  if (typeof window !== 'undefined' && window[key] !== undefined) {
    const value = window[key];
    return converter ? converter(value) : value;
  }
  
  // Return null if neither found (letting classes use their own defaults)
  return null;
}

// Compute configuration values once on import
export const SHELLVIZ_PORT = _getConfigValue('SHELLVIZ_PORT', _strToInt);
export const SHELLVIZ_SHOW_URL = _getConfigValue('SHELLVIZ_SHOW_URL', _strToBool);
export const SHELLVIZ_URL = _getConfigValue('SHELLVIZ_URL'); 