# External Assets Implementation

As of version 0.5.0, Shellviz has separated embedded assets to dramatically reduce bundle sizes.

## Bundle Size Improvements

| Bundle | Before | After | Reduction |
|--------|--------|-------|-----------|
| browser_client.mjs | 1.3MB | 34KB | 97% |
| browser_client.umd.js | 1.4MB | 38KB | 97% |
| node_client.cjs | 1.5MB | 191KB | 87% |
| node_client.js | 1.4MB | 70KB | 95% |

## How It Works

The large React app assets (CSS and JS) are now bundled separately in `embedded-assets.mjs` (1.3MB). This file is loaded dynamically only when the browser widget is used.

## Usage Options

### 1. Auto-Loading (Recommended)
The library will automatically try to load embedded assets from:
- Same directory as the main script
- CDN locations (unpkg, jsdelivr)

```html
<script type="module">
  import { shellviz } from './browser_client.mjs';
  // Assets will be loaded automatically when widget is shown
  const client = shellviz('http://localhost:8080');
  client.showWidget();
</script>
```

### 2. Manual Asset Placement
Place `embedded-assets.mjs` in the same directory as your main bundle:

```
your-app/
├── browser_client.mjs
├── embedded-assets.mjs  ← Include this file
└── index.html
```

### 3. CDN Usage
Assets are automatically served from CDN if local copies aren't found:

```html
<script type="module">
  import { shellviz } from 'https://unpkg.com/shellviz@latest/build/browser_client.mjs';
  // Will load embedded-assets.mjs from CDN automatically
</script>
```

## Migration Guide

### Before (v0.4.x)
```javascript
// Everything was bundled together (large files)
import { shellviz } from 'shellviz';
```

### After (v0.5.0+)
```javascript
// Main bundle is small, assets loaded on-demand
import { shellviz } from 'shellviz';
// No code changes needed! Assets load automatically.
```

## Build Process Changes

The build now generates:
- `browser_client.mjs` - Main ESM bundle (small)
- `browser_client.umd.js` - UMD bundle (small)  
- `node_client.js` - Node ESM bundle (small)
- `node_client.cjs` - Node CJS bundle (small)
- `embedded-assets.mjs` - React app assets (large, loaded on-demand)

## Environment Support

- ✅ Browser ESM modules
- ✅ Browser UMD/script tags
- ✅ Node.js CJS
- ✅ Node.js ESM
- ✅ CDN usage (unpkg, jsdelivr)
- ✅ Bundlers (webpack, rollup, vite, etc.)

## Error Handling

If assets can't be loaded, the widget shows a helpful fallback UI with instructions for fixing the issue. 