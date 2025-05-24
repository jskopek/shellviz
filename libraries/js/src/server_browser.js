/**
 * ShellvizServerInBrowser - A browser-based server that mimics the ShellViz server API
 * This is a drop-in replacement for ShellvizServer when running in the browser
 */
import { appendData } from './utils.js';

class ShellvizServerInBrowser {
    constructor({ port = 5544, showUrl = true } = {}) {
        this.port = port;
        this.entries = [];
        this.clients = new Set();
        this.isRunning = false;
        this.host = 'localhost'; // Browser equivalent

        // Intercept fetch calls to our baseUrl
        this.baseUrl = `http://localhost:${this.port}`;
        this._originalFetch = window.fetch;
        this._setupFetchInterceptor();
        
        // Start the server immediately (like ShellvizServer does)
        this._startServer(showUrl);
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

    delete(id) {
        this.entries = this.entries.filter(entry => entry.id !== id);
    }

    // Same method names as ShellvizServer for compatibility
    showUrl() {
        const url = `http://localhost:${this.port}/`;
        console.log(`ShellvizServerInBrowser running on ${url}`);
    }

    showQrCode() {
        // QR code not needed in browser, but keep method for compatibility
        console.log('QR code not available in browser environment');
    }

    _broadcast(entry) {
        const message = JSON.stringify(entry);
        this.clients.forEach(client => {
            if (client.onmessage) {
                setTimeout(() => {
                    client.onmessage({ data: message });
                }, 0);
            }
        });
    }

    _startServer(showUrl) {
        if (this.isRunning) return;
        this.isRunning = true;
        
        if (showUrl) {
            this.showUrl();
            this.showQrCode();
        }

        // Make the server available globally
        window.__shellvizServerInBrowser = this;
    }

    stop() {
        this.isRunning = false;
        this.clients.clear();

        // Restore original fetch
        if (this._originalFetch) {
            window.fetch = this._originalFetch;
        }

        delete window.__shellvizServerInBrowser;
        console.log('shellvizServerInBrowser stopped');
    }

    // Implement the same API endpoints as the real server
    async handleApiCall(url, options = {}) {
        const path = url.replace(this.baseUrl, '');
        const method = options.method || 'GET';

        if (path === '/api/running' && method === 'GET') {
            return new Response('OK', { status: 200 });
        }

        if (path === '/api/entries' && method === 'GET') {
            return new Response(JSON.stringify(this.entries), {
                status: 200,
                headers: { 'Content-Type': 'application/json' }
            });
        }

        if (path.startsWith('/api/delete/') && method === 'DELETE') {
            const entryId = path.replace('/api/delete/', '');
            this.delete(entryId);
            return new Response('OK', { status: 200 });
        }

        if (path === '/api/clear' && method === 'DELETE') {
            this.clear();
            return new Response('OK', { status: 200 });
        }

        if (path === '/api/send' && method === 'POST') {
            const body = JSON.parse(options.body);
            let { id, data, view, append } = body;
            this.send(data, { id, view, append });
            return new Response('OK', { status: 200 });
        }

        // Default 404
        return new Response('Not Found', { status: 404 });
    }

    _setupFetchInterceptor() {
        const ShellvizServerInBrowser = this;

        window.fetch = function (url, options) {
            // Check if this is a call to our local server
            if (typeof url === 'string' && url.startsWith(ShellvizServerInBrowser.baseUrl) && ShellvizServerInBrowser.isRunning) {
                return ShellvizServerInBrowser.handleApiCall(url, options);
            }

            // Otherwise use original fetch
            return ShellvizServerInBrowser._originalFetch.call(this, url, options);
        };
    }

    // WebSocket-like connection simulation
    createWebSocketConnection(url) {
        if (!url.includes(this.baseUrl.replace('http', 'ws'))) {
            throw new Error('Invalid WebSocket URL for ShellvizServerInBrowser');
        }

        const mockWebSocket = {
            readyState: 1, // OPEN
            onopen: null,
            onmessage: null,
            onclose: null,
            onerror: null,

            close: () => {
                this.clients.delete(mockWebSocket);
                if (mockWebSocket.onclose) {
                    setTimeout(() => mockWebSocket.onclose(), 0);
                }
            }
        };

        // Add to clients for broadcasting
        this.clients.add(mockWebSocket);

        // Simulate connection opening
        setTimeout(() => {
            if (mockWebSocket.onopen) {
                mockWebSocket.onopen();
            }
        }, 0);

        return mockWebSocket;
    }
}

// Override WebSocket constructor to intercept WebSocket connections
if (typeof window !== 'undefined') {
    const originalWebSocket = window.WebSocket;

    window.WebSocket = function (url, protocols) {
        const shellvizServerInBrowser = window.__shellvizServerInBrowser;

        // Check if this is a connection to our local server
        if (shellvizServerInBrowser && shellvizServerInBrowser.isRunning &&
            (url.includes('localhost:5544') || url.includes('127.0.0.1:5544'))) {
            return shellvizServerInBrowser.createWebSocketConnection(url);
        }

        // Otherwise create real WebSocket
        return new originalWebSocket(url, protocols);
    };

    // Copy static properties
    Object.setPrototypeOf(window.WebSocket, originalWebSocket);
    Object.defineProperty(window.WebSocket, 'prototype', {
        value: originalWebSocket.prototype,
        writable: false
    });
}

export default ShellvizServerInBrowser; 