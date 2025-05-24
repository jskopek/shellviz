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
        this._loadFromEmbeddedAssets(container, embeddedAssets);
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
      <div id="root" class="shellviz-widget" style="width: 100%; height: 100%;"></div>
      <style>
        .shellviz-widget { 
          margin: 0; 
          padding: 0; 
          width: 100%; 
          height: 100%;
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
          box-sizing: border-box;
        }
        .shellviz-widget * {
          box-sizing: border-box;
        }
      </style>
    `;

    // Inject CSS with scoping to avoid affecting parent page
    const cssContent = embeddedAssets.getEmbeddedCSS();
    if (cssContent) {
      const style = document.createElement('style');
      // Scope all CSS rules to the widget container
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
      // Improved CSS scoping with better parsing
      return this._processCSS(cssContent, scopeSelector);
    } catch (error) {
      console.warn('Error scoping CSS, falling back to original:', error);
      return cssContent;
    }
  }

  _processCSS(cssContent, scopeSelector) {
    let result = '';
    let pos = 0;
    let depth = 0;
    let currentRule = '';
    let inAtRule = false;
    let atRuleType = '';

    while (pos < cssContent.length) {
      const char = cssContent[pos];
      
      if (char === '@' && depth === 0) {
        // Start of at-rule
        inAtRule = true;
        atRuleType = '';
        currentRule = char;
      } else if (inAtRule && (char === ' ' || char === '\t' || char === '\n') && atRuleType === '') {
        // Extract at-rule type
        atRuleType = currentRule.slice(1).toLowerCase();
        currentRule += char;
      } else if (char === '{') {
        depth++;
        currentRule += char;
        
        if (depth === 1 && !inAtRule) {
          // Regular CSS rule - scope the selectors
          const parts = currentRule.split('{');
          if (parts.length === 2) {
            const selectors = parts[0].trim();
            const scopedSelectors = this._scopeSelectors(selectors, scopeSelector);
            result += scopedSelectors + ' {';
          } else {
            result += currentRule;
          }
          currentRule = '';
        } else if (inAtRule && (atRuleType === 'media' || atRuleType === 'supports' || atRuleType === 'container')) {
          // At-rules that can contain other rules
          result += currentRule;
          currentRule = '';
        } else {
          // Other cases (keyframes, etc.)
          result += currentRule;
          currentRule = '';
        }
      } else if (char === '}') {
        depth--;
        currentRule += char;
        
        if (depth === 0) {
          if (inAtRule && (atRuleType === 'keyframes' || atRuleType === 'font-face' || atRuleType === 'page')) {
            // At-rules that don't need scoping
            result += currentRule;
          } else {
            // End of rule or media query
            result += currentRule;
          }
          currentRule = '';
          inAtRule = false;
          atRuleType = '';
        } else {
          result += currentRule;
          currentRule = '';
        }
      } else {
        currentRule += char;
      }
      
      pos++;
    }
    
    // Add any remaining content
    if (currentRule.trim()) {
      result += currentRule;
    }
    
    return result;
  }

  _scopeSelectors(selectors, scopeSelector) {
    return selectors
      .split(',')
      .map(selector => {
        selector = selector.trim();
        
        // Skip empty selectors
        if (!selector) return selector;
        
        // Don't scope selectors that are already scoped
        if (selector.includes(scopeSelector)) {
          return selector;
        }
        
        // Handle special body/html selectors that need transformation
        if (selector === 'body' || selector === 'html' || selector === '*') {
          return scopeSelector;
        }
        
        // Handle body.class selectors (like body.dark)
        if (selector.match(/^body\./)) {
          const className = selector.replace('body.', '');
          return `${scopeSelector}.${className}`;
        }
        
        // Handle html.class selectors
        if (selector.match(/^html\./)) {
          const className = selector.replace('html.', '');
          return `${scopeSelector}.${className}`;
        }
        
        // Handle pseudo-elements and pseudo-classes at the start
        if (selector.startsWith('::') || selector.startsWith(':')) {
          return `${scopeSelector}${selector}`;
        }
        
        // Handle complex selectors with pseudo-classes/elements
        const pseudoMatch = selector.match(/^([^:]+)(:.*)$/);
        if (pseudoMatch) {
          const [, baseSelector, pseudo] = pseudoMatch;
          const base = baseSelector.trim();
          
          if (base === 'body' || base === 'html') {
            return `${scopeSelector}${pseudo}`;
          }
          
          // Handle body.class:pseudo or html.class:pseudo
          if (base.match(/^body\./)) {
            const className = base.replace('body.', '');
            return `${scopeSelector}.${className}${pseudo}`;
          }
          
          if (base.match(/^html\./)) {
            const className = base.replace('html.', '');
            return `${scopeSelector}.${className}${pseudo}`;
          }
          
          return `${scopeSelector} ${base}${pseudo}`;
        }
        
        // Handle descendant selectors that start with body or html
        if (selector.startsWith('body ') || selector.startsWith('html ')) {
          const rest = selector.replace(/^(body|html) /, '');
          return `${scopeSelector} ${rest}`;
        }
        
        // Handle body.class descendant selectors
        const bodyClassMatch = selector.match(/^body\.([^\\s]+)\\s+(.+)$/);
        if (bodyClassMatch) {
          const [, className, descendant] = bodyClassMatch;
          return `${scopeSelector}.${className} ${descendant}`;
        }
        
        // Regular selectors
        return `${scopeSelector} ${selector}`;
      })
      .join(', ');
  }
}

export default BrowserWidget; 