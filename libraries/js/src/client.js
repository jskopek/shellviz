// shellviz_client.js
// Cross-platform ShellViz client for Node.js and browser

// Utility imports (always available)
import { toJsonSafe, splitArgsAndOptions, getStackTrace } from './utils.js';
import ShellvizServer from './server.js';
import { SHELLVIZ_PORT, SHELLVIZ_SHOW_URL, SHELLVIZ_URL } from './config.js';

class ShellvizClient {
  constructor(opts = {}) {
    this.server = null;
    this.entries = [];

    this.port = SHELLVIZ_PORT || opts.port || 5544;
    this.baseUrl = SHELLVIZ_URL || opts.url || `http://localhost:${this.port}`;
    
    this.existingServerFound = false;
    this._ensureServer();
  }

  async _ensureServer() {
    if (this.existingServerFound) return;
    const exists = await this._checkExistingServer();
    
    // Only try to start ShellvizServer if in Node.js and using localhost
    const isLocalhost = this.baseUrl.includes('localhost') || this.baseUrl.includes('127.0.0.1');
    const isBrowser = typeof window !== 'undefined';
    
    if (!exists && !this.server && typeof process !== 'undefined' && process.versions && process.versions.node && isLocalhost) {
      // console.log(`Starting ShellViz server on port ${this.port}`, this.server)
      this.server = new ShellvizServer({ port: this.port, showUrl: true });
      await new Promise(r => setTimeout(r, 200));
    } else if (exists) {
      this.existingServerFound = true;
      // console.log(`ShellViz server found at ${this.baseUrl}`);
    } else if (!exists && !isLocalhost) {
      // If using a remote URL and can't connect, throw an error
      throw new Error(`Cannot connect to server at ${this.baseUrl}`);
    } else if (!exists && isBrowser && isLocalhost) {
      // Browser environment, can't start server, fall back to browser widget
      console.log('Server not available, falling back to browser widget mode');
      this._fallbackToBrowserWidget = true;
      this.existingServerFound = true; // Prevent further server checks
      
      // Initialize global data for React app to detect embedded mode
      if (!this._localEntries) this._localEntries = [];
      window.__shellvizLocalData = this._localEntries;
      
      return;
    } else {
      // console.log(`ShellViz server not found at ${this.baseUrl}`);
    }
    this.existingServerFound = true;
  }

  async _checkExistingServer() {
    try {
      const response = await fetch(`${this.baseUrl}/api/running`);
      return response.ok;
    } catch (e) {
      return false;
    }
  }

  async send(data, { id = null, view = 'log', append = false, wait = false } = {}) {
    if (typeof window === 'undefined') {
      await this._ensureServer();
    }
    
    // If in browser and server is not available, automatically show widget and use client-side storage
    if (this._fallbackToBrowserWidget) {
      // Auto-show widget on first send if not already shown
      if (!this._browserWidgetShown) {
        this.renderInBrowser();
        this._browserWidgetShown = true;
      }
      
      // Store data locally for the widget to display
      this._storeDataLocally(data, { id, view, append });
      return;
    }
    
    await fetch(`${this.baseUrl}/api/send`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id, data, view, append })
    });
    if (wait) await this.wait();
  }

  _storeDataLocally(data, options) {
    // Store data in a local array that the widget can access
    if (!this._localEntries) this._localEntries = [];
    
    const entry = {
      id: options.id || 'default',
      data: data,
      view: options.view || 'log',
      timestamp: Date.now(),
      append: options.append || false
    };
    
    if (options.append && this._localEntries.length > 0) {
      const lastEntry = this._localEntries[this._localEntries.length - 1];
      if (lastEntry.id === entry.id && lastEntry.view === entry.view) {
        // Append to existing entry
        if (Array.isArray(lastEntry.data) && Array.isArray(data)) {
          lastEntry.data = lastEntry.data.concat(data);
        } else {
          lastEntry.data = data;
        }
        lastEntry.timestamp = entry.timestamp;
      } else {
        this._localEntries.push(entry);
      }
    } else {
      this._localEntries.push(entry);
    }
    
    // Make data available globally for the embedded React app
    window.__shellvizLocalData = this._localEntries;
    
    // Dispatch custom event for the React app to listen to
    window.dispatchEvent(new CustomEvent('shellviz:dataUpdate', {
      detail: { entries: this._localEntries, newEntry: entry }
    }));
    
    // Update any existing widget display
    this._updateWidgetDisplay();
  }

  _updateWidgetDisplay() {
    // Update the fallback UI or React widget with latest data
    const fallbackElement = document.getElementById('fallback-data');
    if (fallbackElement && this._localEntries.length > 0) {
      const latest = this._localEntries[this._localEntries.length - 1];
      const timestamp = new Date(latest.timestamp).toLocaleTimeString();
      const entry = `[${timestamp}] ${latest.view} (${latest.id}): ${JSON.stringify(latest.data, null, 2)}`;
      fallbackElement.innerHTML = entry + '\n\n' + fallbackElement.innerHTML;
    }
    
    // If React widget is loaded, we could trigger an update here
    // For now, we'll rely on the fallback display
  }

  async clear() {
    if (typeof window === 'undefined') {
      await this._ensureServer();
    }
    
    if (this._fallbackToBrowserWidget) {
      // Clear local data
      this._localEntries = [];
      window.__shellvizLocalData = [];
      
      // Dispatch clear event
      window.dispatchEvent(new CustomEvent('shellviz:dataClear'));
      
      // Update fallback UI
      const fallbackElement = document.getElementById('fallback-data');
      if (fallbackElement) {
        fallbackElement.innerHTML = 'No data yet...';
      }
      return;
    }
    
    await fetch(`${this.baseUrl}/api/clear`, { method: 'DELETE' });
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
  table = (data, id = null, append = false) => { 
    // Format data for table view: expects array of arrays
    // If user passes a single array (one row), wrap it in another array
    let formattedData = data;
    if (Array.isArray(data) && data.length > 0 && !Array.isArray(data[0])) {
      // Single row: [1, 2, 3] becomes [[1, 2, 3]]
      formattedData = [data];
    }
    this.send(formattedData, { id, view: 'table', append }); 
  }
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

  // Render in browser function - creates a floating widget with the ShellViz React client
  renderInBrowser = () => {
    if (typeof window === 'undefined') {
      console.warn('renderInBrowser() can only be called in a browser environment');
      return;
    }

    // Check if widget already exists
    if (document.getElementById('shellviz-widget')) {
      console.warn('ShellViz widget already exists');
      return;
    }

    // Create the floating bubble container
    const bubble = document.createElement('div');
    bubble.id = 'shellviz-widget';
    bubble.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: 60px;
      height: 60px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 50%;
      cursor: pointer;
      z-index: 10000;
      box-shadow: 0 4px 20px rgba(0,0,0,0.3);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
    `;

    // Add icon to bubble
    bubble.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    `;

    // Add hover effect
    bubble.addEventListener('mouseenter', () => {
      bubble.style.transform = 'scale(1.1)';
    });
    bubble.addEventListener('mouseleave', () => {
      bubble.style.transform = 'scale(1)';
    });

    let isExpanded = false;
    let widgetPanel = null;

    // Click handler for bubble
    bubble.addEventListener('click', () => {
      if (!isExpanded) {
        // Create expanded panel
        widgetPanel = document.createElement('div');
        widgetPanel.id = 'shellviz-panel';
        widgetPanel.style.cssText = `
          position: fixed;
          bottom: 20px;
          right: 20px;
          width: 300px;
          height: 500px;
          background: white;
          border-radius: 12px;
          box-shadow: 0 8px 32px rgba(0,0,0,0.3);
          z-index: 10001;
          overflow: hidden;
          border: 1px solid #e0e0e0;
        `;

        // Create header with close button
        const header = document.createElement('div');
        header.style.cssText = `
          background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
          color: white;
          padding: 10px 15px;
          font-weight: 600;
          font-size: 14px;
          display: flex;
          justify-content: space-between;
          align-items: center;
        `;
        header.innerHTML = `
          <span>ShellViz</span>
          <button id="shellviz-close" style="
            background: none;
            border: none;
            color: white;
            font-size: 18px;
            cursor: pointer;
            padding: 0;
            width: 20px;
            height: 20px;
            display: flex;
            align-items: center;
            justify-content: center;
          ">&times;</button>
        `;

        // Create iframe container for the React app
        const container = document.createElement('div');
        container.style.cssText = `
          height: calc(100% - 50px);
          overflow: hidden;
        `;

        // Create the React app container directly
        const appContainer = document.createElement('div');
        appContainer.id = 'shellviz-app-root';
        appContainer.style.cssText = `
          width: 100%;
          height: 100%;
          overflow: auto;
        `;

        container.appendChild(appContainer);
        widgetPanel.appendChild(header);
        widgetPanel.appendChild(container);
        document.body.appendChild(widgetPanel);

        // Load and inject the React app
        this._loadReactApp(appContainer);

        // Close button handler
        document.getElementById('shellviz-close').addEventListener('click', (e) => {
          e.stopPropagation();
          widgetPanel.remove();
          isExpanded = false;
          bubble.style.display = 'flex';
        });

        // Hide bubble when expanded
        bubble.style.display = 'none';
        isExpanded = true;
      }
    });

    document.body.appendChild(bubble);
  }

  _loadReactApp = async (container) => {
    try {
      // First try to load embedded assets
      const embeddedAssets = await this._tryLoadEmbeddedAssets();
      
      if (embeddedAssets) {
        console.log('Loading ShellViz from embedded assets');
        this._loadFromEmbeddedAssets(container, embeddedAssets);
        return;
      }

      // Fall back to server loading
      console.log('Loading ShellViz from server assets');
      await this._loadFromServer(container);
      
    } catch (error) {
      console.error('Error loading React app:', error);
      this._showFallbackUI(container, error.message);
    }
  }

  async _tryLoadEmbeddedAssets() {
    try {
      const assets = await import('./embedded-assets.js');
      if (assets.hasEmbeddedAssets()) {
        return assets;
      }
    } catch (e) {
      // Embedded assets not available
    }
    return null;
  }

  _loadFromEmbeddedAssets(container, embeddedAssets) {
    // Create a mini HTML document structure
    container.innerHTML = `
      <div id="root" style="width: 100%; height: 100%;"></div>
      <style>
        body, #root { margin: 0; padding: 0; width: 100%; height: 100%; }
        .shellviz-widget-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
      </style>
    `;

    // Inject CSS
    const cssContent = embeddedAssets.getEmbeddedCSS();
    if (cssContent) {
      const style = document.createElement('style');
      style.textContent = cssContent;
      document.head.appendChild(style);
    }

    // Inject and execute JavaScript
    const jsContent = embeddedAssets.getEmbeddedJS();
    if (jsContent) {
      const script = document.createElement('script');
      script.textContent = jsContent;
      script.onload = () => {
        console.log('ShellViz React app loaded from embedded assets');
      };
      script.onerror = () => {
        console.error('Failed to execute embedded JavaScript');
        this._showFallbackUI(container, 'Failed to execute embedded assets');
      };
      document.head.appendChild(script);
    } else {
      this._showFallbackUI(container, 'No embedded JavaScript found');
    }
  }

  async _loadFromServer(container) {
    // Base URL for assets - try to find them relative to current script
    const baseUrl = this._getAssetBaseUrl();
    
    // Create a mini HTML document structure
    container.innerHTML = `
      <div id="root" style="width: 100%; height: 100%;"></div>
      <style>
        body, #root { margin: 0; padding: 0; width: 100%; height: 100%; }
        .shellviz-widget-container { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif; }
      </style>
    `;

    // Try to load asset manifest to get correct file names
    let assetManifest;
    try {
      const manifestResponse = await fetch(`${baseUrl}/asset-manifest.json`);
      if (manifestResponse.ok) {
        assetManifest = await manifestResponse.json();
      }
    } catch (e) {
      console.warn('Could not load asset manifest, using default filenames');
    }

    // Get CSS and JS file paths
    const cssFile = assetManifest?.files?.['main.css'] || '/static/css/main.5793353d.css';
    const jsFile = assetManifest?.files?.['main.js'] || '/static/js/main.e42d2d9b.js';

    // Load CSS
    const cssLink = document.createElement('link');
    cssLink.rel = 'stylesheet';
    cssLink.href = `${baseUrl}${cssFile}`;
    document.head.appendChild(cssLink);

    // Load JavaScript
    const script = document.createElement('script');
    script.src = `${baseUrl}${jsFile}`;
    script.onload = () => {
      console.log('ShellViz React app loaded successfully from server');
      // The React app should automatically mount to the #root element
    };
    script.onerror = () => {
      console.error('Failed to load ShellViz React app from server');
      this._showFallbackUI(container, baseUrl);
    };
    document.head.appendChild(script);
  }

  _showFallbackUI = (container, errorInfo) => {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
        <h3 style="margin: 0 0 15px 0; color: #333;">ShellViz Widget</h3>
        <p style="margin: 0 0 10px 0; font-size: 14px;">React app unavailable</p>
        <div style="background: #f5f5f5; padding: 15px; border-radius: 8px; margin: 15px 0; text-align: left;">
          <h4 style="margin: 0 0 10px 0; font-size: 12px; color: #666;">Current Data:</h4>
          <div id="fallback-data" style="font-family: monospace; font-size: 11px; color: #333; max-height: 300px; overflow-y: auto;">
            No data yet...
          </div>
        </div>
        <p style="font-size: 11px; color: #999; margin-top: 15px;">
          Error: ${typeof errorInfo === 'string' ? errorInfo : 'Asset loading failed'}
        </p>
        <button onclick="this.parentElement.innerHTML='Loading...'; window.shellviz.renderInBrowser();" 
                style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 10px;">
          Retry
        </button>
      </div>
    `;
    
    // Set up fallback data display
    this._setupFallbackDataDisplay();
  }

  _setupFallbackDataDisplay = () => {
    // Override send method to also update fallback UI
    const originalSend = this.send.bind(this);
    this.send = async (data, options = {}) => {
      // Call original send
      await originalSend(data, options);
      
      // Update fallback UI if it exists
      const fallbackElement = document.getElementById('fallback-data');
      if (fallbackElement) {
        const timestamp = new Date().toLocaleTimeString();
        const entry = `[${timestamp}] ${options.view || 'log'}: ${JSON.stringify(data, null, 2)}`;
        fallbackElement.innerHTML = entry + '\n\n' + fallbackElement.innerHTML;
      }
    };
  }

  _getAssetBaseUrl = () => {
    // Try to determine base URL for assets
    // First check if we're running with a server
    if (this.existingServerFound && this.baseUrl) {
      return this.baseUrl;
    }

    // Otherwise try to find assets relative to current location
    // This assumes the built assets are served alongside the current page
    const currentPath = window.location.pathname;
    if (currentPath.includes('/build/') || currentPath.includes('/client_build/')) {
      // We're likely in a development environment, try to find the assets
      const basePath = currentPath.split('/build/')[0] || currentPath.split('/client_build/')[0];
      return `${window.location.origin}${basePath}/build/client_build`;
    }

    // Default to trying localhost server
    return `http://localhost:${this.port}`;
  }
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
export function renderInBrowser() { return _global().renderInBrowser(); }
export function Shellviz() { return _global(); }

if (typeof window !== 'undefined') {
  window.shellviz = _global();
}