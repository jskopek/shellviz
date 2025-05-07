/* browser/index.js  – chosen automatically by bundlers */
import ShellVizClient from './client.js';

const client = new ShellVizClient();
client.init();

export const { log, json, table, markdown, bar, clear, wait } = client;
