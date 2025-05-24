# ShellViz Browser Integration

## Overview

ShellViz provides seamless browser integration using `ShellvizServerInBrowser` as a drop-in replacement for the Node.js `ShellvizServer`. This allows the full ShellViz experience to work entirely within the browser by creating a virtual server that intercepts network calls and communicates with an embedded React visualization component.

## How It Works

### Browser Server Architecture

When ShellViz runs in a browser environment, it uses `ShellvizServerInBrowser` which:

1. **Mimics the Server API**: Implements the exact same interface as the Node.js server
2. **Hijacks Network Calls**: Intercepts `fetch()` and `WebSocket` calls to the server URL
3. **Runs Entirely In-Browser**: No external server needed - everything happens client-side
4. **Embedded Visualization**: Works with an embedded React app for real-time data visualization

### Network Call Interception

The browser server works by replacing the global `fetch` and `WebSocket` functions:

```javascript
// Original fetch calls to http://localhost:5544/api/* 
// are intercepted and handled by ShellvizServerInBrowser
window.fetch = function (url, options) {
    if (url.startsWith(shellvizServerInBrowser.baseUrl)) {
        return shellvizServerInBrowser.handleApiCall(url, options);
    }
    return originalFetch.call(this, url, options);
};
```

This means when your code calls `shellviz.log()` or `shellviz.table()`, the HTTP requests are handled locally without any network traffic.

## Key Files

### `src/server_browser.js`
- **Class**: `ShellvizServerInBrowser`
- **Constructor**: `constructor({ port = 5544, showUrl = true } = {})`
- **Methods**: `send()`, `clear()`, `delete()`, `showUrl()`, `showQrCode()`
- **Auto-start**: Automatically starts when instantiated (like `ShellvizServer`)
- **Network Hijacking**: Replaces `window.fetch` and `window.WebSocket`

### Browser Field Mapping in `package.json`
```json
{
  "browser": {
    "./src/server.js": "./src/browser_server_shim.js"
  }
}
```

When bundling for browsers, build tools automatically replace imports of `server.js` with the browser shim, which exports `ShellvizServerInBrowser`.

### `src/client.js`
- **Unified Code Path**: Uses `new ShellvizServer({ port: this.port, showUrl: true })` in both environments
- **Automatic Widget**: Shows browser widget when using the browser server
- **Transparent Operation**: No environment-specific logic needed

## API Endpoint Simulation

The browser server handles the same HTTP endpoints as the real server:

- `GET /api/running` - Server health check
- `GET /api/entries` - Retrieve all visualization entries  
- `POST /api/send` - Send new data for visualization
- `DELETE /api/clear` - Clear all entries
- `DELETE /api/delete/:id` - Delete specific entry

## WebSocket Simulation

For real-time updates, the browser server creates mock WebSocket connections that:

- Maintain the same API as real WebSockets (`onopen`, `onmessage`, `onclose`, etc.)
- Broadcast updates to connected "clients" (browser widgets)
- Handle connection lifecycle events

## Data Flow

1. **Initialization**: `ShellvizClient` creates `ShellvizServerInBrowser` instance
2. **API Calls**: Your code calls `shellviz.log()`, `shellviz.table()`, etc.
3. **HTTP Simulation**: Calls are converted to HTTP requests to `localhost:5544`
4. **Interception**: `ShellvizServerInBrowser` intercepts and handles requests locally
5. **Data Storage**: Entries are stored in browser memory
6. **Broadcasting**: Updates are broadcast to connected visualization widgets
7. **Rendering**: React components render the data in real-time

## Benefits

1. **No External Dependencies**: Works entirely offline in the browser
2. **Identical API**: Same interface as Node.js server for seamless compatibility  
3. **Real-time Updates**: Full WebSocket simulation for live data streaming
4. **Embedded Visualization**: React app runs directly in the browser
5. **Zero Configuration**: Automatically starts and configures itself

## Usage Example

```javascript
import { log, table, renderInBrowser } from 'shellviz';

// Show the visualization widget
renderInBrowser();

// Send data - all handled in-browser
log('Hello from browser!');
table([
    ['Name', 'Age'],
    ['Alice', 30],
    ['Bob', 25]
]);
```

The browser server automatically starts, intercepts the network calls, stores the data, and updates the visualization widget - all without any external server or network requests. 