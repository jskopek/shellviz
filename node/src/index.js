// shellviz.js  — v0.1 proof‑of‑concept
// npm i ws (only runtime dep)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const os = require('os');

const DEFAULT_PORT = 5544;

// -------- core class -------------------------------------------------------

function getLocalIp() {
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
        id = id || Date.now().toString();

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

        const existingEntryIndex = this.entries.findIndex(item => item.id === id);

        let value = data;
        if (existingEntryIndex !== -1 && append) {
            const existingData = this.entries[existingEntryIndex].data;
            if (Array.isArray(existingData) && Array.isArray(data)) {
                value = [...existingData, ...data];
            } else if (typeof existingData === 'string' && typeof data === 'string') {
                value = existingData + data;
            } else if (typeof existingData === 'object' && typeof data === 'object') {
                value = { ...existingData, ...data };
            }
        }

        const entry = {
            id,
            data: value,
            view,
            append
        };

        // Update or append the entry
        if (existingEntryIndex !== -1) {
            this.entries[existingEntryIndex] = entry;
        } else {
            this.entries.push(entry);
        }

        // Broadcast to all clients
        this._broadcast(entry);

        if (wait) {
            return this.wait();
        }
    }

    clear() {
        this.entries = [];
        this._broadcast({ kind: 'clear' });
    }

    wait() {
        return new Promise(resolve => setTimeout(resolve, 10));
    }

    // sugar layers
    log = (d, i) => this.send([[d, Date.now() / 1000]], { id: i || 'log', view: 'log', append: true });
    json = (d, i) => this.send(d, { id: i, view: 'json', append: false });
    table = (d, i) => this.send(d, { id: i, view: 'table', append: false });
    markdown = (d, i) => this.send(d, { id: i, view: 'markdown', append: false });
    bar = (d, i) => this.send(d, { id: i, view: 'bar', append: false });
    // ...add the rest as needed

    /* private ------------------------------------------------------------ */

    _broadcast(msg) {
        const json = JSON.stringify(msg);
        this.clients.forEach(ws => ws.readyState === 1 && ws.send(json));
    }

    _startServer(showUrl) {
        const server = http.createServer((req, res) => {
            const CLIENT_DIST_PATH = process.env.CLIENT_DIST_PATH || path.join(__dirname, '../dist');
            /* ---------- main page with context ---------------------------- */
            if (req.method === 'GET' && req.url === '/') {
                const index_template = fs.readFileSync(path.join(CLIENT_DIST_PATH, 'index.html'), 'utf8');
                const html = renderTemplate(index_template, {
                    entries: JSON.stringify(this.entries)
                });
                res.writeHead(200, { 'Content-Type': 'text/html' })
                    .end(html);
            }

            /* ---------- static assets (optional) -------------------------- */
            else if (req.method === 'GET' && req.url.startsWith('/static/')) {
                const filePath = path.join(CLIENT_DIST_PATH, req.url);
                fs.readFile(filePath, (err, data) => {
                    if (err) return res.writeHead(404).end('not found');
                    const ct = { '.js': 'text/javascript', '.css': 'text/css' }[path.extname(filePath)] || 'application/octet-stream';
                    res.writeHead(200, { 'Content-Type': ct }).end(data);
                });
            }

            /* ---------- health check -------------------------------------- */
            else if (req.method === 'GET' && req.url === '/api/running') {
                res.writeHead(200).end('ok');
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

            /* ---------- fallback ------------------------------------------ */
            else {
                res.writeHead(404).end('not found');
            }
        });

        // Start HTTP server first
        server.listen(this.port, this.host, () => {
            if (showUrl) {
                const url = `http://${this.host}:${this.port}/`;
                console.log(`ShellViz server listening on ${url}`);
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
    log: (d, i) => _global().log(d, i),
    json: (d, i) => _global().json(d, i),
    table: (d, i) => _global().table(d, i),
    markdown: (d, i) => _global().markdown(d, i),
    bar: (d, i) => _global().bar(d, i),
    Shellviz: () => _global(),

    // …export the rest as needed
};