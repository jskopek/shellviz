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
    
    // Load saved preferences
    this.preferences = this._loadPreferences();

    this.show();
  }

  show(expandWidget = false) {
    console.log('about to show widget', expandWidget);
    if (typeof window === 'undefined') {
      console.warn('BrowserWidget can only be used in a browser environment');
      return;
    }

    if (!this.isVisible) {
      // only create the bubble if it's not visible
      this._createBubble();
      this.isVisible = true;
    }
    
    // If the user had the panel expanded when they last used it, expand it automatically
    if (this.preferences.isExpanded || expandWidget) {
      this._expandWidget();
    }
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
      background: linear-gradient(135deg, #E67E22 0%, #D35400 100%);
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
      <svg width="28" height="28" viewBox="0 0 512 513" fill="white">
        <g transform="translate(0.000000,513.000000) scale(0.100000,-0.100000)">
          <path d="M4415 5067 c-16 -12 -39 -30 -49 -39 -11 -10 -26 -18 -33 -18 -7 0
          -13 -4 -13 -8 0 -5 -12 -15 -27 -23 -16 -8 -37 -22 -47 -31 -11 -10 -26 -18
          -33 -18 -7 0 -13 -4 -13 -10 0 -5 -9 -10 -20 -10 -11 0 -20 -3 -20 -7 0 -5
          -10 -13 -23 -18 -12 -6 -42 -21 -67 -34 -76 -40 -79 -41 -95 -41 -8 0 -15 -4
          -15 -10 0 -5 -9 -10 -20 -10 -11 0 -28 -4 -38 -9 -55 -28 -104 -35 -238 -33
          -77 0 -153 6 -168 12 -15 5 -53 10 -85 10 -31 0 -61 4 -66 9 -6 5 -37 12 -70
          15 -33 3 -88 10 -122 15 -35 6 -90 16 -123 21 -33 6 -87 15 -120 20 -33 6 -86
          14 -117 20 -350 58 -681 94 -868 93 -168 -1 -377 -30 -460 -63 -21 -9 -60 -18
          -112 -27 -18 -3 -33 -9 -33 -14 0 -5 -13 -9 -30 -9 -16 0 -30 -4 -30 -10 0 -5
          -9 -10 -20 -10 -11 0 -28 -4 -38 -9 -9 -5 -30 -14 -47 -21 -16 -7 -38 -16 -47
          -21 -10 -5 -25 -9 -33 -9 -8 0 -15 -4 -15 -10 0 -5 -6 -10 -14 -10 -17 0 -100
          -42 -104 -52 -2 -5 -12 -8 -23 -8 -10 0 -19 -4 -19 -10 0 -5 -6 -10 -13 -10
          -7 0 -22 -8 -33 -17 -10 -10 -31 -24 -46 -32 -16 -8 -28 -18 -28 -23 0 -4 -6
          -8 -13 -8 -8 0 -34 -19 -60 -42 -25 -24 -60 -57 -79 -74 -52 -47 -122 -127
          -137 -157 -8 -15 -18 -27 -23 -27 -4 0 -8 -6 -8 -13 0 -7 -8 -22 -18 -33 -21
          -24 -82 -142 -82 -160 0 -8 -4 -14 -10 -14 -5 0 -10 -9 -10 -19 0 -11 -4 -23
          -10 -26 -5 -3 -10 -17 -10 -31 0 -13 -4 -24 -10 -24 -5 0 -10 -13 -10 -29 0
          -17 -4 -33 -10 -36 -5 -3 -10 -19 -10 -35 0 -16 -4 -31 -9 -34 -4 -3 -12 -25
          -15 -48 -4 -24 -12 -68 -17 -98 -6 -30 -15 -91 -21 -135 -14 -106 -20 -839 -8
          -935 5 -41 12 -136 15 -210 3 -74 9 -178 14 -230 5 -52 12 -133 16 -180 3 -47
          10 -94 15 -105 5 -11 11 -45 14 -75 8 -87 33 -211 61 -310 8 -30 17 -63 20
          -73 8 -34 60 -122 87 -149 16 -14 28 -31 28 -36 0 -5 14 -35 30 -66 17 -31 43
          -80 59 -110 34 -64 111 -180 123 -184 4 -2 8 -9 8 -16 0 -7 12 -26 27 -42 16
          -16 41 -47 58 -69 36 -49 245 -255 258 -255 5 0 17 -8 26 -18 9 -10 32 -29 51
          -42 19 -13 41 -30 48 -37 7 -7 17 -13 22 -13 5 0 15 -6 22 -12 36 -35 304
          -178 332 -178 9 0 16 -4 16 -10 0 -5 11 -10 24 -10 14 0 27 -4 30 -9 3 -5 16
          -11 28 -14 13 -3 61 -16 108 -30 262 -78 567 -102 835 -66 72 9 109 17 255 51
          62 14 184 56 250 86 30 13 70 31 88 39 18 8 37 11 44 7 6 -4 8 -3 5 3 -8 13
          20 26 35 16 6 -3 8 -1 4 5 -3 6 7 16 24 24 16 7 30 16 30 20 0 5 9 8 20 8 11
          0 20 5 20 10 0 6 6 10 13 10 7 0 22 8 33 18 10 9 31 23 47 31 15 8 27 18 27
          23 0 4 6 8 13 8 6 0 26 12 42 28 17 15 57 49 89 77 68 57 226 215 226 225 0 4
          20 30 45 56 25 27 45 55 45 62 0 6 4 12 8 12 5 0 15 12 23 27 8 16 22 37 32
          47 9 11 17 26 17 33 0 7 3 13 8 13 4 0 28 39 52 87 25 49 48 90 53 91 4 2 7
          10 7 17 0 8 13 42 29 77 16 35 39 92 51 128 12 36 26 69 31 75 5 5 9 19 9 31
          0 13 4 25 9 28 5 3 11 20 14 38 3 18 12 64 21 101 16 72 22 106 35 222 5 39
          11 77 14 85 8 21 21 255 21 375 0 124 -14 294 -26 318 -7 14 -1 25 33 55 85
          75 199 196 199 210 0 4 11 20 25 36 14 16 25 33 25 37 0 4 6 14 13 21 29 31
          142 261 168 343 7 22 17 44 21 49 4 6 8 18 8 28 0 10 4 26 9 36 15 30 31 88
          31 113 0 14 4 29 9 34 5 6 12 30 15 55 4 25 11 77 17 115 13 84 17 377 6 455
          -12 80 -36 186 -59 255 -26 77 -108 245 -120 245 -4 0 -8 9 -8 20 0 11 -3 20
          -7 20 -5 0 -19 17 -33 38 -34 50 -225 242 -242 242 -7 0 -26 -11 -43 -23z
          m-2320 -2152 c28 -4 54 -11 59 -16 6 -5 27 -9 47 -9 21 0 41 -4 44 -10 3 -5
          19 -10 35 -10 16 0 32 -4 35 -10 3 -5 22 -10 41 -10 19 0 42 -4 52 -9 9 -5 37
          -14 62 -21 25 -6 59 -16 76 -21 17 -5 40 -9 52 -9 11 0 24 -4 27 -10 3 -5 19
          -10 35 -10 16 0 31 -4 34 -9 3 -5 20 -11 38 -14 18 -3 51 -10 73 -16 101 -26
          197 -49 253 -62 159 -35 212 -46 297 -60 131 -22 217 -30 377 -35 l166 -6 6
          -46 c4 -26 11 -87 16 -137 11 -99 24 -203 40 -310 5 -38 12 -92 16 -120 3 -27
          10 -54 15 -60 5 -5 9 -23 9 -40 0 -76 82 -327 113 -347 21 -13 10 -92 -22
          -162 -17 -38 -31 -75 -31 -82 0 -7 -3 -14 -8 -16 -4 -1 -17 -23 -30 -48 -48
          -92 -67 -125 -84 -144 -10 -11 -18 -26 -18 -33 0 -7 -4 -13 -9 -13 -5 0 -13
          -9 -16 -20 -3 -11 -12 -26 -18 -32 -7 -7 -28 -33 -47 -58 -40 -52 -126 -145
          -189 -204 -24 -22 -58 -55 -75 -71 -17 -17 -47 -41 -66 -55 -19 -13 -41 -30
          -48 -37 -7 -7 -26 -20 -42 -30 -17 -9 -30 -21 -30 -25 0 -4 -5 -8 -11 -8 -6 0
          -29 -13 -52 -29 -97 -66 -345 -175 -482 -212 -16 -4 -48 -13 -70 -19 -161 -42
          -456 -61 -645 -41 -142 16 -182 21 -200 28 -8 3 -21 7 -28 9 -7 1 -36 8 -65
          14 -49 12 -67 17 -119 39 -13 5 -48 18 -78 29 -85 31 -125 47 -130 52 -3 3
          -25 15 -50 28 -87 45 -125 67 -138 79 -6 6 -21 15 -32 18 -11 3 -20 10 -20 15
          0 5 -8 11 -19 15 -10 3 -29 15 -42 26 -13 12 -40 33 -59 48 -97 72 -282 259
          -340 341 -13 19 -27 37 -30 40 -10 10 -68 95 -89 132 -11 21 -30 54 -41 73
          -11 19 -29 51 -40 70 -11 20 -20 42 -20 50 0 8 -4 15 -10 15 -5 0 -10 9 -10
          19 0 11 -4 22 -9 25 -11 7 -19 53 -26 156 -8 118 -25 280 -36 339 -12 74 -12
          421 1 421 6 0 10 14 10 30 0 17 5 30 10 30 6 0 10 7 10 16 0 17 167 184 183
          184 5 0 17 8 26 18 9 10 45 38 81 62 36 24 67 46 70 49 3 3 14 11 25 17 50 28
          70 39 75 45 10 11 172 89 186 89 8 0 14 4 14 8 0 5 23 15 50 22 28 7 50 17 50
          22 0 4 11 8 24 8 14 0 27 4 30 9 3 5 20 11 38 14 18 3 53 11 78 17 25 6 72 15
          104 21 33 5 62 12 65 15 7 7 411 -2 476 -11z"/>
          <path d="M1542 1707 c-25 -26 -30 -81 -9 -101 43 -43 93 -36 116 16 17 37 0
          81 -35 97 -36 16 -48 14 -72 -12z"/>
          <path d="M3063 1707 c-26 -25 -31 -80 -10 -101 42 -42 92 -37 115 13 21 44 10
          75 -35 99 -30 17 -45 14 -70 -11z"/>
          <path d="M2057 1332 c-9 -10 -17 -31 -17 -47 0 -28 44 -115 59 -115 4 0 16 -8
          27 -17 43 -39 101 -56 194 -56 89 0 153 17 188 51 7 6 18 12 23 12 18 0 69 93
          69 125 0 34 -26 65 -54 65 -23 0 -43 -21 -61 -62 -19 -48 -80 -78 -158 -78
          -60 0 -127 17 -127 32 0 4 -6 8 -14 8 -8 0 -24 21 -37 48 -27 54 -62 67 -92
          34z"/>
        </g>
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

    // Create expanded panel using saved dimensions
    this.panel = document.createElement('div');
    this.panel.id = 'shellviz-panel';
    this.panel.style.cssText = `
      position: fixed;
      bottom: 20px;
      right: 20px;
      width: ${this.preferences.width}px;
      height: ${this.preferences.height}px;
      background: white;
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0,0,0,0.3);
      overflow: hidden;
      z-index: 10001;
      border: 1px solid #e0e0e0;
      min-width: 250px;
      min-height: 300px;
      max-width: 800px;
      max-height: 800px;
    `;

    // Create content wrapper for React app
    const contentWrapper = document.createElement('div');
    contentWrapper.id = 'shellviz-content';
    contentWrapper.style.cssText = `
      width: 100%;
      height: 100%;
      position: relative;
      z-index: 1;
    `;
    
    this.panel.appendChild(contentWrapper);

    // Add resize handles to the panel (not the content wrapper)
    this._addResizeHandles(this.panel);

    document.body.appendChild(this.panel);

    // Create floating header chevron above the panel
    const header = document.createElement('div');
    header.id = 'shellviz-header';
    
    // Calculate header position based on actual panel dimensions
    const panelRect = this.panel.getBoundingClientRect();
    const headerBottom = window.innerHeight - panelRect.top + 10;
    const headerRight = window.innerWidth - panelRect.right + (panelRect.width / 2) - 15;
    
    header.style.cssText = `
      position: fixed;
      bottom: ${headerBottom}px;
      right: ${headerRight}px;
      width: 30px;
      height: 20px;
      background: linear-gradient(135deg, #E67E22 0%, #D35400 100%);
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
      header.style.background = 'linear-gradient(135deg, #D4701A 0%, #B8460E 100%)';
      header.style.transform = 'scale(1.05)';
    });
    header.addEventListener('mouseleave', () => {
      header.style.background = 'linear-gradient(135deg, #E67E22 0%, #D35400 100%)';
      header.style.transform = 'scale(1)';
    });

    // Click handler for header chevron
    header.addEventListener('click', (e) => {
      e.stopPropagation();
      this._collapseWidget();
    });

    document.body.appendChild(header);

    // Load and inject the React app into the content wrapper (not the panel directly)
    this._loadReactApp(contentWrapper);

    // Hide bubble when expanded
    this.bubble.style.display = 'none';
    this.isExpanded = true;
    
    // Save expanded state
    this._updateExpandedState(true);
  }

  _addResizeHandles(panel) {
    // Create resize handles
    const topHandle = document.createElement('div');
    const leftHandle = document.createElement('div');
    const topLeftHandle = document.createElement('div');

    // Top resize handle
    topHandle.style.cssText = `
      position: absolute;
      top: 0;
      left: 8px;
      right: 8px;
      height: 8px;
      cursor: n-resize;
      z-index: 10003;
      background: transparent;
    `;

    // Left resize handle  
    leftHandle.style.cssText = `
      position: absolute;
      left: 0;
      top: 8px;
      bottom: 8px;
      width: 8px;
      cursor: w-resize;
      z-index: 10003;
      background: transparent;
    `;

    // Top-left corner resize handle
    topLeftHandle.style.cssText = `
      position: absolute;
      top: 0;
      left: 0;
      width: 8px;
      height: 8px;
      cursor: nw-resize;
      z-index: 10004;
      background: transparent;
    `;

    panel.appendChild(topHandle);
    panel.appendChild(leftHandle);
    panel.appendChild(topLeftHandle);

    // Add resize functionality
    this._addResizeEventListeners(topHandle, 'top');
    this._addResizeEventListeners(leftHandle, 'left');
    this._addResizeEventListeners(topLeftHandle, 'top-left');
  }

  _addResizeEventListeners(handle, direction) {
    let isResizing = false;
    let startX, startY, startWidth, startHeight;

    handle.addEventListener('mousedown', (e) => {
      e.preventDefault();
      e.stopPropagation();
      
      isResizing = true;
      startX = e.clientX;
      startY = e.clientY;
      
      const rect = this.panel.getBoundingClientRect();
      startWidth = rect.width;
      startHeight = rect.height;
      
      document.body.style.userSelect = 'none';
      document.body.style.cursor = handle.style.cursor;

      const handleMouseMove = (e) => {
        if (!isResizing) return;

        const deltaX = e.clientX - startX;
        const deltaY = e.clientY - startY;

        let newWidth = startWidth;
        let newHeight = startHeight;

        if (direction === 'top' || direction === 'top-left') {
          newHeight = startHeight - deltaY;
        }

        if (direction === 'left' || direction === 'top-left') {
          newWidth = startWidth - deltaX;
        }

        // Apply constraints
        newWidth = Math.max(250, Math.min(800, newWidth));
        newHeight = Math.max(300, Math.min(800, newHeight));

        // Update panel dimensions while keeping position fixed
        this.panel.style.width = newWidth + 'px';
        this.panel.style.height = newHeight + 'px';
        // Keep bottom and right fixed at 20px - don't change these
        // this.panel.style.bottom = '20px';
        // this.panel.style.right = '20px';

        // Update header position to stay above panel
        const header = document.getElementById('shellviz-header');
        if (header) {
          const panelRect = this.panel.getBoundingClientRect();
          const headerBottom = window.innerHeight - panelRect.top + 10;
          const headerRight = window.innerWidth - panelRect.right + (panelRect.width / 2) - 15;
          header.style.bottom = headerBottom + 'px';
          header.style.right = headerRight + 'px';
        }
      };

      const handleMouseUp = () => {
        isResizing = false;
        document.body.style.userSelect = '';
        document.body.style.cursor = '';
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        
        // Save the new dimensions when resize is complete
        if (this.panel) {
          const rect = this.panel.getBoundingClientRect();
          this._updateDimensions(rect.width, rect.height);
        }
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
    });
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
    
    // Save collapsed state
    this._updateExpandedState(false);
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

  _loadPreferences() {
    try {
      const saved = localStorage.getItem('shellviz-widget-preferences');
      if (saved) {
        const preferences = JSON.parse(saved);
        return {
          width: preferences.width || 300,
          height: preferences.height || 500,
          isExpanded: preferences.isExpanded || false
        };
      }
    } catch (error) {
      console.warn('Failed to load widget preferences:', error);
    }
    
    // Default preferences
    return {
      width: 300,
      height: 500,
      isExpanded: false
    };
  }

  _savePreferences() {
    try {
      localStorage.setItem('shellviz-widget-preferences', JSON.stringify(this.preferences));
    } catch (error) {
      console.warn('Failed to save widget preferences:', error);
    }
  }

  _updateDimensions(width, height) {
    this.preferences.width = width;
    this.preferences.height = height;
    this._savePreferences();
  }

  _updateExpandedState(isExpanded) {
    this.preferences.isExpanded = isExpanded;
    this._savePreferences();
  }
}

export default BrowserWidget; 