// shellviz_client.js
// Cross-platform ShellViz client for Node.js and browser

// Utility imports (always available)
import { toJsonSafe, splitArgsAndOptions, getStackTrace } from './utils.js';
import ShellvizServer from './server.js';

const DEFAULT_PORT = 5544;

class ShellvizClient {
  constructor(opts = {}) {
    this.server = null;
    this.port = opts.port || DEFAULT_PORT;
    this.entries = [];
    this.endpoint = opts.endpoint || `http://localhost:${this.port}`;
    this.existingServerFound = false;
    this._ensureServer();
  }

  async _ensureServer() {
    if (this.existingServerFound) return;
    const exists = await this._checkExistingServer();
    // Only try to start ShellvizServer if in Node.js
    if (!exists && !this.server && typeof process !== 'undefined' && process.versions && process.versions.node) {
      // console.log(`Starting ShellViz server on port ${this.port}`, this.server)
      this.server = new ShellvizServer({ port: this.port, showUrl: true });
      await new Promise(r => setTimeout(r, 200));
    } else if (exists) {
      this.existingServerFound = true;
      // console.log(`ShellViz server found at ${this.endpoint}`);
    } else {
      // console.log(`ShellViz server not found at ${this.endpoint}`);
    }
    this.existingServerFound = true;
  }

  async _checkExistingServer() {
    try {
      const response = await fetch(`${this.endpoint}/api/running`);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  async send(data, { id = null, view = 'log', append = false, wait = false } = {}) {
    if (typeof window === 'undefined') {
      await this._ensureServer();
    }
    await fetch(`${this.endpoint}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, data, view, append })
    });
    if (wait) await this.wait();
  }

  async clear() {
    if (typeof window === 'undefined') {
      await this._ensureServer();
    }
    await fetch(`${this.endpoint}/api/clear`, { method: 'DELETE' });
  }

  wait() {
    return new Promise(resolve => setTimeout(resolve, 10));
  }

  // sugar layers
  log = (...args) => {
    const [data, options] = splitArgsAndOptions(args, ['id', 'level']);
    const { id = 'log', level } = options;
    const safeData = toJsonSafe(data);
    const value = [[safeData, Date.now() / 1000]];
    this.send(value, { id, view: 'log', append: true });
  }
  table = (data, id = null, append = false) => { this.send(data, { id, view: 'table', append }); }
  json = (data, id = null, append = false) => { this.send(data, { id, view: 'json', append }); }
  markdown = (data, id = null, append = false) => { this.send(data, { id, view: 'markdown', append }); }
  progress = (data, id = null, append = false) => { this.send(data, { id, view: 'progress', append }); }
  pie = (data, id = null, append = false) => { this.send(data, { id, view: 'pie', append }); }
  number = (data, id = null, append = false) => { this.send(data, { id, view: 'number', append }); }
  area = (data, id = null, append = false) => { this.send(data, { id, view: 'area', append }); }
  bar = (data, id = null, append = false) => { this.send(data, { id, view: 'bar', append }); }
  card = (data, id = null, append = false) => { this.send(data, { id, view: 'card', append }); }
  location = (data, id = null, append = false) => { this.send(data, { id, view: 'location', append }); }
  raw = (data, id = null, append = false) => { this.send(data, { id, view: 'raw', append }); }
  stack = (locals = null, id = null) => { this.send(getStackTrace(locals), { id, view: 'stack' }); }
}

// -------- exported singleton + helpers ---------------------------------

function _global() {
  if (!globalThis.__shellviz) globalThis.__shellviz = new ShellvizClient();
  return globalThis.__shellviz;
}


export default ShellvizClient;
export { ShellvizClient };

export function send(d, o) { return _global().send(d, o); }
export function clear() { return _global().clear(); }
export function wait() { return _global().wait(); }
export function table(data, id = null, append = false) { return _global().table(data, id, append); }
export function log(...args) { return _global().log(...args); }
export function json(data, id = null, append = false) { return _global().json(data, id, append); }
export function markdown(data, id = null, append = false) { return _global().markdown(data, id, append); }
export function progress(data, id = null, append = false) { return _global().progress(data, id, append); }
export function pie(data, id = null, append = false) { return _global().pie(data, id, append); }
export function number(data, id = null, append = false) { return _global().number(data, id, append); }
export function area(data, id = null, append = false) { return _global().area(data, id, append); }
export function bar(data, id = null, append = false) { return _global().bar(data, id, append); }
export function card(data, id = null, append = false) { return _global().card(data, id, append); }
export function location(data, id = null, append = false) { return _global().location(data, id, append); }
export function raw(data, id = null, append = false) { return _global().raw(data, id, append); }
export function stack(locals = null, id = null) { return _global().stack(locals, id); }
export function Shellviz() { return _global(); }

if (typeof window !== 'undefined') {
  window.shellviz = _global();
}