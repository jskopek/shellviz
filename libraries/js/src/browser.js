/* browser/index.js  – chosen automatically by bundlers */
import Shellviz from './browser_client.js';

const client = new Shellviz();

export default Shellviz;
export const { table, log, json, markdown, progress, pie, number, area, bar, card, location, raw, clear, wait, stack } = client;