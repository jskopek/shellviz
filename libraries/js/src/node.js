// shellviz.js  — v0.1 proof‑of‑concept
// npm i ws qrcode-terminal (only runtime deps)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const qrcode = require('qrcode-terminal');
const { getLocalIp, getStackTrace } = require('./utils_node.js');
const { appendData, toJsonSafe, splitArgsAndOptions } = require('./utils');
const DEFAULT_PORT = 5544;

// -------- core class -------------------------------------------------------


class ShellViz {
    constructor({ port = DEFAULT_PORT, showUrl = true } = {}) {
        this.port = port;
        this.entries = [];           // everything ever sent
        this.clients = new Set();    // active WS connections
        this.existingServerFound = false;
        this.host = getLocalIp();

        // Check if server exists before starting
        this._checkExistingServer().then(exists => {
            this.existingServerFound = exists;
            if (!exists) {
                this._startServer(showUrl);
            }
        });
    }

    async _checkExistingServer() {
        try {
            const response = await fetch(`http://${this.host}:${this.port}/api/running`);
            return response.ok;
        } catch (e) {
            return false;
        }
    }

    /* public helpers – these mirror the Python names -------------------- */

    send(data, { id = null, view = 'log', append = false, wait = false } = {}) {
        // If we're in client mode, send to existing server
        if (this.existingServerFound) {
            return fetch(`http://${this.host}:${this.port}/api/send`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, data, view, append })
            }).then(() => {
                if (wait) return this.wait();
            });
        }

        const existingEntryIndex = id ? this.entries.findIndex(item => item.id === id) : -1;

        let entry;
        if (existingEntryIndex >= 0) {
            const value = append ? appendData(this.entries[existingEntryIndex].data, data) : data;
            this.entries[existingEntryIndex].data = value;
            this.entries[existingEntryIndex].view = view;
            entry = this.entries[existingEntryIndex];
        } else {
            id = id || Date.now().toString();
            entry = {
                id,
                data,
                view,
                append
            };
            if (data === '___clear___') {
                // don't store clear requests in the entries list; we only want to send them to the client via websocket
            } else {
                this.entries.push(entry);
            }
        }

        // Broadcast to all clients
        this._broadcast(entry);

        if (wait) {
            return this.wait();
        }
    }

    clear() {
        if (this.existingServerFound) {
            fetch(`http://${this.host}:${this.port}/api/clear`, { method: 'DELETE' })
        } else {
            this.entries = [];
            this.send('___clear___');
        }
    }

    wait() {
        return new Promise(resolve => setTimeout(resolve, 10));
    }

    // sugar layers
    table = (data, id=null, append=false) => { this.send(data, { id, view: 'table', append }); }
    json = (data, id=null, append=false) => { this.send(data, { id, view: 'json', append }); }
    markdown = (data, id=null, append=false) => { this.send(data, { id, view: 'markdown', append }); }
    progress = (data, id=null, append=false) => { this.send(data, { id, view: 'progress', append }); }
    pie = (data, id=null, append=false) => { this.send(data, { id, view: 'pie', append }); }
    number = (data, id=null, append=false) => { this.send(data, { id, view: 'number', append }); }
    area = (data, id=null, append=false) => { this.send(data, { id, view: 'area', append }); }
    bar = (data, id=null, append=false) => { this.send(data, { id, view: 'bar', append }); }
    card = (data, id=null, append=false) => { this.send(data, { id, view: 'card', append }); }
    location = (data, id=null, append=false) => { this.send(data, { id, view: 'location', append }); }
    raw = (data, id=null, append=false) => { this.send(data, { id, view: 'raw', append }); }
    stack = (locals=null, id=null) => { this.send(getStackTrace(locals), { id, view: 'stack' }); }
    log = (...args) => {
        const [data, options] = splitArgsAndOptions(args, ['id', 'level']);
        const { id = 'log', level } = options;
        const safeData = toJsonSafe(data);
        const value = [[safeData, Date.now() / 1000]];
        this.send(value, { id, view: 'log', append: true });
    }

    showUrl() {
        const url = `http://localhost:${this.port}/`;
        console.log(`ShellViz running on ${url}`);
    }

    showQrCode() {
        try {
            const url = `http://${this.host}:${this.port}/`;
            qrcode.generate(url, { small: true });
        } catch (e) {
            console.log('The `qrcode-terminal` package is required to show the QR code. Install it with: npm install qrcode-terminal');
        }
    }

    /* private ------------------------------------------------------------ */

    _broadcast(msg) {
        const json = JSON.stringify(msg);
        this.clients.forEach(ws => ws.readyState === 1 && ws.send(json));
    }

    _startServer(showUrl) {
        const server = http.createServer((req, res) => {
            // Add CORS headers to all responses
            // This enables the client to make cross-origin requests (e.g. via the browser plugin) to the server
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Max-Age', '86400');

            if (req.method === 'OPTIONS') {
                // OPTIONS requests are used to check if the server is running and to get the CORS headers
                res.writeHead(204).end();
                return;
            }

            // Get the path to the shellviz package; this can be overridden by the CLIENT_DIST_PATH environment variable
            const shellvizDistPath = path.dirname(require.resolve('shellviz'));
            const CLIENT_DIST_PATH = process.env.CLIENT_DIST_PATH || path.join(shellvizDistPath, 'client_build');

            /* ---------- main page with context ---------------------------- */
            if (req.method === 'GET' && req.url === '/') {
                const index_template = fs.readFileSync(path.join(CLIENT_DIST_PATH, 'index.html'), 'utf8');
                const html = renderTemplate(index_template, {
                    entries: JSON.stringify(this.entries)
                });
                res.writeHead(200, { 'Content-Type': 'text/html' })
                    .end(html);
            }

            /* ---------- get all entries -------------------------------------- */
            else if (req.method === 'GET' && req.url === '/api/entries') {
                res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(this.entries));
            }



            /* ---------- health check -------------------------------------- */
            else if (req.method === 'GET' && req.url === '/api/running') {
                res.writeHead(200).end('ok');
            }

            /* ---------- delete entry -------------------------------------- */
            else if (req.method === 'DELETE' && req.url.startsWith('/api/delete/')) {
                const entryId = req.url.split('/').pop();
                this.entries = this.entries.filter(entry => entry.id !== entryId);
                res.writeHead(200).end();
            }

            /* ---------- clear all entries --------------------------------- */
            else if (req.method === 'DELETE' && req.url === '/api/clear') {
                this.entries = [];
                this.send('___clear___');
                res.writeHead(200).end();
            }

            /* ---------- entry POST endpoint ------------------------------- */
            else if (req.method === 'POST' && req.url === '/api/send') {
                let body = '';
                req.on('data', c => body += c)
                    .on('end', () => {
                        try {
                            const entry = JSON.parse(body);
                            if (entry.data) {
                                this.send(entry.data, {
                                    id: entry.id,
                                    append: entry.append,
                                    view: entry.view
                                });
                                res.writeHead(200).end();
                            } else {
                                res.writeHead(404).end('not found');
                            }
                        } catch (e) {
                            res.writeHead(400).end('invalid json');
                        }
                    });
            }

            /* ---------- fallback: serve any file from CLIENT_DIST_PATH -------------------------- */
            else if (req.method === 'GET') {
                const relPath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
                const filePath = path.join(CLIENT_DIST_PATH, relPath);
                fs.stat(filePath, (err, stats) => {
                    if (err || !stats.isFile()) {
                        res.writeHead(404, {
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
                            'Access-Control-Allow-Headers': 'Content-Type'
                        }).end('not found');
                        return;
                    }
                    // Determine content type
                    const ext = path.extname(filePath).toLowerCase();
                    const contentTypes = {
                        '.html': 'text/html',
                        '.json': 'application/json',
                        '.js': 'text/javascript',
                        '.css': 'text/css',
                        '.png': 'image/png',
                        '.jpg': 'image/jpeg',
                        '.jpeg': 'image/jpeg',
                        '.gif': 'image/gif',
                        '.svg': 'image/svg+xml',
                        '.ico': 'image/x-icon',
                        '.txt': 'text/plain',
                        '.map': 'application/json',
                        '.wasm': 'application/wasm',
                        '.woff': 'font/woff',
                        '.woff2': 'font/woff2',
                        '.ttf': 'font/ttf',
                        '.eot': 'application/vnd.ms-fontobject',
                        '.otf': 'font/otf'
                    };
                    const ct = contentTypes[ext] || 'application/octet-stream';
                    // Read and send file
                    fs.readFile(filePath, (err, data) => {
                        if (err) {
                            res.writeHead(404, {
                                'Access-Control-Allow-Origin': '*',
                                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
                                'Access-Control-Allow-Headers': 'Content-Type'
                            }).end('not found');
                            return;
                        }
                        res.writeHead(200, {
                            'Content-Type': ct,
                            'Access-Control-Allow-Origin': '*',
                            'Access-Control-Allow-Methods': 'GET, POST, OPTIONS, DELETE',
                            'Access-Control-Allow-Headers': 'Content-Type'
                        }).end(data);
                    });
                });
            }
            /* ---------- fallback ------------------------------------------ */
            else {
                res.writeHead(404).end('not found');
            }
        });

        // Start HTTP server first
        server.listen(this.port, '0.0.0.0', () => {
            if (showUrl) {
                this.showUrl();
                this.showQrCode();
            }
        });

        // Only start WebSocket server if HTTP server started successfully
        const wss = new WebSocketServer({ server });
        wss.on('connection', ws => {
            this.clients.add(ws);
            ws.on('close', () => this.clients.delete(ws));
        });

        // Handle server errors
        server.on('error', err => {
            if (err.code === 'EADDRINUSE') {
                console.log('Server already running, switching to client mode');
                this.existingServerFound = true;
            } else {
                throw err;
            }
        });

        wss.on('error', err => {
            if (err.code === 'EADDRINUSE') {
                console.log('WebSocket server already running, switching to client mode');
                this.existingServerFound = true;
            } else {
                throw err;
            }
        });
    }
}

// -------- exported singleton + helpers ---------------------------------

function _global() {
    if (!globalThis.__shellviz) globalThis.__shellviz = new ShellViz();
    return globalThis.__shellviz;
}

// --- tiny helper to mimic write_file(..., {entries: ...}) -------------
function renderTemplate(template, context) {
    return template.replace(/\$([A-Za-z_][A-Za-z0-9_]*)/g, (m, k) =>
        Object.prototype.hasOwnProperty.call(context, k) ? context[k] : m
    );
}

module.exports = {
    send: (d, o) => _global().send(d, o),
    clear: () => _global().clear(),
    wait: () => _global().wait(),
    showUrl: () => _global().showUrl(),
    showQrCode: () => _global().showQrCode(),
    table: (data, id=null, append=false) => _global().table(data, id, append),
    log: (...args) => _global().log(...args),
    json: (data, id=null, append=false) => _global().json(data, id, append),
    markdown: (data, id=null, append=false) => _global().markdown(data, id, append),
    progress: (data, id=null, append=false) => _global().progress(data, id, append),
    pie: (data, id=null, append=false) => _global().pie(data, id, append),
    number: (data, id=null, append=false) => _global().number(data, id, append),
    area: (data, id=null, append=false) => _global().area(data, id, append),
    bar: (data, id=null, append=false) => _global().bar(data, id, append),
    card: (data, id=null, append=false) => _global().card(data, id, append),
    location: (data, id=null, append=false) => _global().location(data, id, append),
    raw: (data, id=null, append=false) => _global().raw(data, id, append),
    stack: (locals=null, id=null) => _global().stack(locals, id),
    Shellviz: () => _global(),
};