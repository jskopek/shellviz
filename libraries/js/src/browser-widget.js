/**
 * BrowserWidget - A floating browser widget for Shellviz
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
      console.warn('Shellviz widget already exists');
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
      overflow: hidden;
      z-index: 10001;
      border: 1px solid #e0e0e0;
    `;

    document.body.appendChild(this.panel);

    // Create floating header chevron above the panel
    const header = document.createElement('div');
    header.id = 'shellviz-header';
    header.style.cssText = `
      position: fixed;
      bottom: 530px;
      right: 135px;
      width: 30px;
      height: 20px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border-radius: 15px 15px 4px 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      z-index: 10002;
      box-shadow: 0 2px 8px rgba(0,0,0,0.2);
      transition: all 0.2s ease;
    `;

    // Add chevron down icon
    header.innerHTML = `
      <svg width="10" height="10" viewBox="0 0 24 24" fill="white" style="opacity: 0.9;">
        <path d="M7 10l5 5 5-5z"/>
      </svg>
    `;

    // Add hover effect to header
    header.addEventListener('mouseenter', () => {
      header.style.background = 'linear-gradient(135deg, #5a6fd8 0%, #6a4190 100%)';
      header.style.transform = 'scale(1.05)';
    });
    header.addEventListener('mouseleave', () => {
      header.style.background = 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)';
      header.style.transform = 'scale(1)';
    });

    // Click handler for header chevron
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      this._collapseWidget();
    });

    document.body.appendChild(header);

    // Load and inject the React app directly into panel (preserving original behavior)
    this._loadReactApp(this.panel);

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

    // Clean up floating header
    const header = document.getElementById('shellviz-header');
    if (header) {
      header.remove();
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
        console.log('Loading Shellviz from embedded assets');
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
        /* Shellviz Widget Styles - Contained */
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
        console.log('Shellviz React app loaded from embedded assets (simple)');
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
      <div style="padding: 20px; text-align: center; color: #666;">Error: ${typeof errorInfo === 'string' ? errorInfo : 'Asset loading failed'}</div>
    `;
  }
}

export default BrowserWidget; 