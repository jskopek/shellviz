// shellviz.js  — v0.1 proof‑of‑concept
// npm i ws qrcode-terminal (only runtime deps)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');
const os = require('os');
const qrcode = require('qrcode-terminal');

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
    table = (data, id=null, append=false) => this.send(data, { id, view: 'table', append });
    log = (data, id=null, append=true) => this.send([[data, Date.now() / 1000]], { id: id || 'log', view: 'log', append });
    json = (data, id=null, append=false) => this.send(data, { id: id, view: 'json', append });
    markdown = (data, id=null, append=false) => this.send(data, { id: id, view: 'markdown', append });
    progress = (data, id=null, append=false) => this.send(data, { id: id, view: 'progress', append });
    pie = (data, id=null, append=false) => this.send(data, { id: id, view: 'pie', append });
    number = (data, id=null, append=false) => this.send(data, { id: id, view: 'number', append });
    area = (data, id=null, append=false) => this.send(data, { id: id, view: 'area', append });
    bar = (data, id=null, append=false) => this.send(data, { id: id, view: 'bar', append });
    card = (data, id=null, append=false) => this.send(data, { id: id, view: 'card', append });
    location = (data, id=null, append=false) => this.send(data, { id: id, view: 'location', append });
    raw = (data, id=null, append=false) => this.send(data, { id: id, view: 'raw', append });

    showUrl() {
        const url = `http://${this.host}:${this.port}/`;
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
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Max-Age', '86400');

            if (req.method === 'OPTIONS') {
                // OPTIONS requests are used to check if the server is running and to get the CORS headers
                res.writeHead(204).end();
                return;
            }

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
    log: (data, id=null, append=true) => _global().log(data, id, append),
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
    Shellviz: () => _global(),
};