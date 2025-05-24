// node_server.js
// Standalone ShellViz server implementation

import http from 'http';
import fs from 'fs';
import path from 'path';
import os from 'os';
import { WebSocketServer } from 'ws';
import qrcode from 'qrcode-terminal';
import { appendData } from './utils.js';
import { createRequire } from 'module';
import { SHELLVIZ_PORT, SHELLVIZ_SHOW_URL } from './config.js';

class ShellvizServer {
    constructor({ port = 5544, showUrl = true } = {}) {
        // Use config values if available, otherwise use defaults from parameters
        this.port = SHELLVIZ_PORT || port;
        const defaultShowUrl = SHELLVIZ_SHOW_URL !== null ? SHELLVIZ_SHOW_URL : showUrl;
        
        this.entries = [];
        this.clients = new Set();
        this.host = getLocalIp();
        this._startServer(defaultShowUrl);
    }

    send(data, { id = null, view = 'log', append = false } = {}) {
        const existingEntryIndex = id ? this.entries.findIndex(item => item.id === id) : -1;
        let entry;
        if (existingEntryIndex >= 0) {
            const value = append ? appendData(this.entries[existingEntryIndex].data, data) : data;
            this.entries[existingEntryIndex].data = value;
            this.entries[existingEntryIndex].view = view;
            entry = this.entries[existingEntryIndex];
        } else {
            id = id || Date.now().toString();
            entry = { id, data, view, append };
            if (data !== '___clear___') {
                this.entries.push(entry);
            }
        }
        this._broadcast(entry);
    }

    clear() {
        this.entries = [];
        this.send('___clear___');
    }

    _broadcast(msg) {
        const json = JSON.stringify(msg);
        this.clients.forEach(ws => ws.readyState === 1 && ws.send(json));
    }

    _startServer(showUrl) {
        const server = http.createServer((req, res) => {
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS, DELETE');
            res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
            res.setHeader('Access-Control-Max-Age', '86400');

            if (req.method === 'OPTIONS') {
                res.writeHead(204).end();
                return;
            }

            const clientDistPath = getClientDistPath();

            if (req.method === 'GET' && req.url === '/') {
                const index_template = fs.readFileSync(path.join(clientDistPath, 'index.html'), 'utf8');
                const html = index_template.replace('{{entries}}', JSON.stringify(this.entries));
                res.writeHead(200, { 'Content-Type': 'text/html' }).end(html);
            } else if (req.method === 'GET' && req.url === '/api/entries') {
                res.writeHead(200, { 'Content-Type': 'application/json' }).end(JSON.stringify(this.entries));
            } else if (req.method === 'GET' && req.url === '/api/running') {
                res.writeHead(200).end('ok');
            } else if (req.method === 'DELETE' && req.url.startsWith('/api/delete/')) {
                const entryId = req.url.split('/').pop();
                this.entries = this.entries.filter(entry => entry.id !== entryId);
                res.writeHead(200).end();
            } else if (req.method === 'DELETE' && req.url === '/api/clear') {
                this.clear();
                res.writeHead(200).end();
            } else if (req.method === 'POST' && req.url === '/api/send') {
                let body = '';
                req.on('data', c => body += c).on('end', () => {
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
            } else if (req.method === 'GET') {
                const relPath = req.url.startsWith('/') ? req.url.slice(1) : req.url;
                const filePath = path.join(clientDistPath, relPath);
                fs.stat(filePath, (err, stats) => {
                    if (err || !stats.isFile()) {
                        res.writeHead(404).end('not found');
                        return;
                    }
                    fs.readFile(filePath, (err, data) => {
                        if (err) {
                            res.writeHead(404).end('not found');
                            return;
                        }
                        res.writeHead(200).end(data);
                    });
                });
            } else {
                res.writeHead(404).end('not found');
            }
        });

        server.listen(this.port, '0.0.0.0', () => {
            if (showUrl) {
                this.showUrl();
                this.showQrCode();
            }
        });

        const wss = new WebSocketServer({ server });
        wss.on('connection', ws => {
            this.clients.add(ws);
            ws.on('close', () => this.clients.delete(ws));
        });
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
}

export default ShellvizServer;


/* helper functions */
function getLocalIp() {
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

function getClientDistPath() {
    // Helper to get clientDistPath in both ESM and CJS
    if (process.env.CLIENT_DIST_PATH) {
        return process.env.CLIENT_DIST_PATH;
    }
    let shellvizDistPath;
    // ESM: use createRequire(import.meta.url)
    if (typeof require === 'undefined') {
        const require = createRequire(import.meta.url);
        shellvizDistPath = path.dirname(require.resolve('shellviz'));
    } else {
        // CJS: use native require
        shellvizDistPath = path.dirname(require.resolve('shellviz'));
    }
    return path.join(shellvizDistPath, 'client_build');
}