/**
 * BrowserWidget - A floating browser widget for ShellViz
 * Handles creating the UI, loading assets, and managing the widget lifecycle
 */

class BrowserWidget {
  constructor(shellvizClient) {
    this.client = shellvizClient;
    this.isVisible = false;
    this.isExpanded = false;
    this.bubble = null;
    this.panel = null;
  }

  show() {
    if (typeof window === 'undefined') {
      console.warn('BrowserWidget can only be used in a browser environment');
      return;
    }

    if (this.isVisible) {
      console.warn('BrowserWidget is already visible');
      return;
    }

    this._createBubble();
    this.isVisible = true;
  }

  hide() {
    if (this.bubble) {
      this.bubble.remove();
      this.bubble = null;
    }
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }
    this.isVisible = false;
    this.isExpanded = false;
  }

  _createBubble() {
    // Check if widget already exists
    if (document.getElementById('shellviz-widget') || document.getElementById('shellviz-panel')) {
      console.warn('ShellViz widget already exists');
      return;
    }

    // Create the floating bubble container
    this.bubble = document.createElement('div');
    this.bubble.id = 'shellviz-widget';
    this.bubble.style.cssText = `
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
    this.bubble.innerHTML = `
      <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
      </svg>
    `;

    // Add hover effect
    this.bubble.addEventListener('mouseenter', () => {
      this.bubble.style.transform = 'scale(1.1)';
    });
    this.bubble.addEventListener('mouseleave', () => {
      this.bubble.style.transform = 'scale(1)';
    });

    // Click handler for bubble
    this.bubble.addEventListener('click', () => {
      this._expandWidget();
    });

    document.body.appendChild(this.bubble);
  }

  _expandWidget() {
    if (this.isExpanded) return;

    // Create expanded panel
    this.panel = document.createElement('div');
    this.panel.id = 'shellviz-panel';
    this.panel.style.cssText = `
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

    // Create container for the React app
    const container = document.createElement('div');
    container.style.cssText = `
      height: calc(100% - 50px);
      overflow: hidden;
    `;

    // Create the React app container
    const appContainer = document.createElement('div');
    appContainer.id = 'shellviz-app-root';
    appContainer.style.cssText = `
      width: 100%;
      height: 100%;
      overflow: auto;
    `;

    container.appendChild(appContainer);
    this.panel.appendChild(header);
    this.panel.appendChild(container);
    document.body.appendChild(this.panel);

    // Load and inject the React app
    this._loadReactApp(appContainer);

    // Close button handler
    document.getElementById('shellviz-close').addEventListener('click', (e) => {
      e.stopPropagation();
      this._collapseWidget();
    });

    // Hide bubble when expanded
    this.bubble.style.display = 'none';
    this.isExpanded = true;
  }

  _collapseWidget() {
    if (!this.isExpanded) return;

    // Clean up panel
    if (this.panel) {
      this.panel.remove();
      this.panel = null;
    }

    // Show bubble again
    this.bubble.style.display = 'flex';
    this.isExpanded = false;
  }

  async _loadReactApp(container) {
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

  _showFallbackUI(container, errorInfo) {
    container.innerHTML = `
      <div style="padding: 20px; text-align: center; color: #666; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;">
        <h3 style="margin: 0 0 15px 0; color: #333;">ShellViz Widget</h3>
        <p style="margin: 0 0 10px 0; font-size: 14px;">React app unavailable</p>
        <p style="font-size: 11px; color: #999; margin-top: 15px;">
          Error: ${typeof errorInfo === 'string' ? errorInfo : 'Asset loading failed'}
        </p>
        <button onclick="location.reload();" 
                style="background: #667eea; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; font-size: 12px; margin-top: 10px;">
          Retry
        </button>
      </div>
    `;
  }

  _getAssetBaseUrl() {
    // Try to determine base URL for assets
    // First check if we're running with a server
    if (this.client.existingServerFound && this.client.baseUrl) {
      return this.client.baseUrl;
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
    return `http://localhost:${this.client.port}`;
  }
}

export default BrowserWidget; 