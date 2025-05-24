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
      // Set global configuration for the React app
      window.__shellvizConfig = {
        port: this.client.port,
        baseUrl: this.client.baseUrl,
        hostname: this.client.baseUrl.includes('localhost') ? 'localhost' : 
                 this.client.baseUrl.includes('127.0.0.1') ? '127.0.0.1' :
                 new URL(this.client.baseUrl).hostname
      };
      
      // First try to load embedded assets
      const embeddedAssets = await this._tryLoadEmbeddedAssets();
      
      if (embeddedAssets) {
        console.log('Loading ShellViz from embedded assets');
        this._loadFromEmbeddedAssetsSimple(container, embeddedAssets);
        return;
      }
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
      <div id="root" class="shellviz-widget" style="
        width: 100%; 
        height: 100%;
        /* CSS containment to prevent style leaking */
        contain: style layout;
        isolation: isolate;
      "></div>
      <style>
        .shellviz-widget { 
          margin: 0; 
          padding: 0; 
          width: 100%; 
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          box-sizing: border-box;
          /* Additional isolation */
          position: relative;
          z-index: 0;
        }
        .shellviz-widget * {
          box-sizing: border-box;
        }
      </style>
    `;

    // Inject CSS with minimal scoping to avoid affecting parent page
    const cssContent = embeddedAssets.getEmbeddedCSS();
    if (cssContent) {
      const style = document.createElement('style');
      // Simple scoping - just add .shellviz-widget to the front of everything
      const scopedCSS = this._scopeCSS(cssContent, '.shellviz-widget');
      style.textContent = scopedCSS;
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

  // Alternative ultra-simple approach - no CSS parsing needed
  _loadFromEmbeddedAssetsSimple(container, embeddedAssets) {
    // Create a highly specific container that isolates styles
    container.innerHTML = `
      <div id="root" class="shellviz-widget-isolated" data-shellviz="true" style="
        width: 100%; 
        height: 100%;
        contain: style layout;
        isolation: isolate;
        position: relative;
        z-index: 0;
      "></div>
      <style>
        /* High specificity styles for the widget */
        [data-shellviz="true"] { 
          margin: 0 !important; 
          padding: 0 !important; 
          width: 100% !important; 
          height: 100% !important;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif !important;
          box-sizing: border-box !important;
        }
        [data-shellviz="true"] * {
          box-sizing: border-box !important;
        }
      </style>
    `;

    // Inject CSS without scoping - relies on containment
    const cssContent = embeddedAssets.getEmbeddedCSS();
    if (cssContent) {
      const style = document.createElement('style');
      // Add CSS with high specificity prefix
      const prefixedCSS = `
        /* ShellViz Widget Styles - Contained */
        .shellviz-widget-isolated { 
          ${cssContent.replace(/body\b/g, '&').replace(/html\b/g, '&')}
        }
      `;
      style.textContent = prefixedCSS;
      document.head.appendChild(style);
    }

    // Inject and execute JavaScript
    const jsContent = embeddedAssets.getEmbeddedJS();
    if (jsContent) {
      const script = document.createElement('script');
      script.textContent = jsContent;
      
      script.onload = () => {
        console.log('ShellViz React app loaded from embedded assets (simple)');
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

  // Helper method to scope CSS to a specific selector
  _scopeCSS(cssContent, scopeSelector) {
    try {
      // Simple regex-based scoping - much simpler than parsing
      return cssContent
        // Handle body/html selectors
        .replace(/\bbody\b/g, scopeSelector)
        .replace(/\bhtml\b/g, scopeSelector)
        // Handle universal selector
        .replace(/^\s*\*\s*{/gm, `${scopeSelector} * {`)
        // Handle regular selectors (add scope to beginning of each rule)
        .replace(/([^{}]+){/g, (match, selectors) => {
          // Skip @-rules (media, keyframes, etc.)
          if (selectors.trim().startsWith('@')) {
            return match;
          }
          
          const scopedSelectors = selectors
            .split(',')
            .map(selector => {
              selector = selector.trim();
              if (!selector || selector.includes(scopeSelector)) {
                return selector;
              }
              
              // Don't scope keyframes, font-face, etc.
              if (selector.includes('@')) {
                return selector;
              }
              
              return `${scopeSelector} ${selector}`;
            })
            .join(', ');
          
          return `${scopedSelectors} {`;
        });
    } catch (error) {
      console.warn('Error scoping CSS, falling back to original:', error);
      return cssContent;
    }
  }
}

export default BrowserWidget; 