// shellviz.js  — v0.1 proof‑of‑concept
// npm i ws (only runtime dep)

const http = require('http');
const fs = require('fs');
const path = require('path');
const { WebSocketServer } = require('ws');

const DEFAULT_PORT = 5544;
const INDEX_TEMPLATE = fs.readFileSync(path.join(__dirname, '../client/dist/index.html'), 'utf8');

// -------- core class -------------------------------------------------------

class ShellViz {
    constructor({ port = DEFAULT_PORT, showUrl = true } = {}) {
        this.port = port;
        this.entries = [];           // everything ever sent
        this.clients = new Set();    // active WS connections

        this._startServer(showUrl);
    }

    /* public helpers – these mirror the Python names -------------------- */

    send(data, { id = null, view = 'log', append = false, wait = false } = {}) {
        id = id || Date.now().toString();
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
            /* ---------- main page with context ---------------------------- */
            if (req.method === 'GET' && req.url === '/') {
              const html = renderTemplate(INDEX_TEMPLATE, {
                entries: JSON.stringify(this.entries)
              });
              res.writeHead(200, {'Content-Type':'text/html'})
                 .end(html);
            }
      
            /* ---------- static assets (optional) -------------------------- */
            else if (req.method === 'GET' && req.url.startsWith('/static/')) {
              const filePath = path.join(__dirname, '../client/dist' + req.url);
              fs.readFile(filePath, (err, data) => {
                if (err) return res.writeHead(404).end('not found');
                const ct = { '.js':'text/javascript', '.css':'text/css' }[path.extname(filePath)] || 'application/octet-stream';
                res.writeHead(200, {'Content-Type': ct}).end(data);
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

        const wss = new WebSocketServer({ port: this.port + 1 });
        wss.on('connection', ws => {
            this.clients.add(ws);
            /* replay everything we know so new client gets history */
            ws.send(JSON.stringify({ kind: 'init', entries: this.entries }));
            ws.on('close', () => this.clients.delete(ws));
        });

        server.listen(this.port, () => {
            if (showUrl) {
                const url = `http://localhost:${this.port}/`;
                console.log(`ShellViz server listening on ${url}`);
            }
        });

        server.on('error', async err => {
            if (err.code === 'EADDRINUSE') {
                // somebody else is already serving – fall back to "client mode"
                this._post = entry =>
                    fetch(`http://localhost:${this.port}/api/send`,
                        {
                            method: 'POST', 
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify(entry)
                        });
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
    // …export the rest as needed
};