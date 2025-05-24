# Shellviz Javascript Package
----------------------------

# Installation

`npm install shellviz`

# Usage

```
import { log } from 'shellviz';
log('hello world')
```

You can also import other visualizations, and you can choose to import using CommonJS or EJS

```
const { json, table } = require('shellviz')
json({ test: 'data', timestamp: new Date().toISOString() });
table([
    ['Name', 'Value'],
    ['Test', 123],
    ['Another', 'value']
]); 
```

The package can be importer on both the Node.JS and browser-facing/client side, however due to limitations on the browser-side it can only send data to an existing Shellviz server that has been initialized by the Node.JS or Python library


Basic Client-Side Usage:

```html
<script src="https://unpkg.com/shellviz"></script>
<script>
const { log } = shellviz;
log('hello from the browser');
</script>
```

Or via Module:

```html
<script type="module">
    import Shellviz from 'https://unpkg.com/shellviz/dist/browser.mjs';
    const s = new Shellviz()
    s.log('hello world')

    // or

    import { log, json } from 'https://unpkg.com/shellviz/dist/browser.mjs'
    log('hello world')
</script>
```


# Building

To build the package locally:

1. First, build the client:
```bash
cd client
npm install
npm run build
```

2. Then build the Node.js package:
```bash
cd libraries/js
npm install
npm run build
```

3. To create a local package for testing:
```bash
npm run pack  # Creates shellviz-x.x.x.tgz in the ../build directory
```

4. To test locally, you can create a test directory and install the package:
```bash
mkdir test
cd test
npm init -y
npm install ../../build/shellviz-x.x.x.tgz
```

5. Create a test file (e.g., `test.js` or `test.mjs`) and run it:
```bash
# For CommonJS
node test.js

# For ES Modules
node test.mjs
```

6. To test in the client side, create a simple React app and import the client
```bash
npx create-react-app test-web
cd test-web
npm install ../../build/shellviz-x.x.x.tgz
```

The package supports both CommonJS and ES Modules, so you can use either `require()` or `import` syntax in your code.

## Deploying

To deploy the package to npm:

### 🔐 1. Authenticate with npm
Make sure you have an npm account and are logged in:
```bash
npm login
```

---

### 🔁 2. Bump the version

#### ✅ For a stable release:
Use one of the following depending on the type of change:
```bash
npm version patch  # e.g., 1.0.0 → 1.0.1 (bug fixes)
npm version minor  # e.g., 1.0.0 → 1.1.0 (new features, backwards-compatible)
npm version major  # e.g., 1.0.0 → 2.0.0 (breaking changes)
```

#### 🧪 For a beta/alpha/pre-release version:
Use the `--preid` flag to specify the pre-release tag:

Start from a stable version:
```bash
npm version prerelease --preid=beta   # e.g., 1.0.0 → 1.0.1-beta.0
```

Or from an existing beta:
```bash
npm version prerelease --preid=beta   # e.g., 1.0.1-beta.0 → 1.0.1-beta.1
```

You can also combine with `minor` or `major` if needed:
```bash
npm version minor --preid=beta   # e.g., 1.0.1 → 1.1.0-beta.0
npm version major --preid=beta   # e.g., 1.1.5 → 2.0.0-beta.0
```

---

### 🧱 3. Build the package
Build and verify your output:
```bash
npm run build
npm pack   # creates a tarball to inspect before publishing
```

---

### 🚀 4. Publish to npm

#### For stable releases:
```bash
npm publish
```

#### For beta/pre-release versions:
Publish under a separate tag to avoid affecting the `latest` version:
```bash
npm publish --tag beta
```

This allows users to explicitly opt-in:
```bash
npm install shellviz@beta
```

You can also use other tags like `alpha`, `next`, or `experimental`.

You can promote a tested beta to latest later using:
```bash
npm dist-tag add shellviz@1.1.0-beta.3 latest




# ShellViz JavaScript Configuration

ShellViz JavaScript libraries support configuration through environment variables (Node.js) and window objects (browser) with a clear fallback hierarchy.

## Configuration Hierarchy

1. **Constructor parameters** (highest priority)
2. **Environment Variables** (`process.env` in Node.js)
3. **Window Variables** (`window.SHELLVIZ_*` in browser)
4. **Default Values** (visible in function declarations)

## Available Configuration Options

### Environment Variables (Node.js)

All environment variables are prefixed with `SHELLVIZ_`:

- `SHELLVIZ_PORT` - Port number for the server (default: 5544)
- `SHELLVIZ_SHOW_URL` - Whether to show URL on startup (default: true)
- `SHELLVIZ_URL` - Custom base URL for the server (default: None, constructs from port)

### Window Variables (Browser)

For browser environments, you can set global variables:

```javascript
// Set these before importing ShellViz
window.SHELLVIZ_PORT = 8080;
window.SHELLVIZ_SHOW_URL = false;
window.SHELLVIZ_URL = "https://my-custom-domain.com";
```

### Environment Variable Examples (Node.js)

```bash
# Set port to 8080
export SHELLVIZ_PORT=8080

# Disable URL display on startup
export SHELLVIZ_SHOW_URL=false

# Use a custom URL
export SHELLVIZ_URL="https://my-remote-shellviz.com"

# Run your JavaScript application
node my_script.js
```

## Usage Examples

### JavaScript Client

```javascript
import { ShellvizClient } from 'shellviz';

// Uses defaults: port=5544, url=undefined
// Overridden by process.env or window vars if present
const sv = new ShellvizClient();

// Override specific settings
const sv = new ShellvizClient({ port: 9000, url: "https://my-server.com" });
```

### JavaScript Server

```javascript
import ShellvizServer from 'shellviz/server';

// Uses defaults: port=5544, showUrl=true
// Overridden by process.env if present
const server = new ShellvizServer();

// Override settings
const server = new ShellvizServer({ port: 9000, showUrl: false });
```

## Cross-Platform Support

The configuration system works seamlessly across different environments:

### Node.js Environment
- Checks `process.env.SHELLVIZ_*` variables
- Full server and client functionality available

### Browser Environment  
- Checks `window.SHELLVIZ_*` variables
- Client functionality available (no local server)
- Safe fallbacks prevent crashes

### Webpack/Bundler Environment
- Uses compile-time environment variables if available
- Falls back to window variables or defaults

## Configuration Implementation

The configuration values are computed once when the module is imported:

```javascript
// In your code, you can import the computed values directly:
import { SHELLVIZ_PORT, SHELLVIZ_SHOW_URL, SHELLVIZ_URL } from 'shellviz/config';

// These will be null if not set via process.env or window
console.log(SHELLVIZ_PORT);      // e.g., 8080 or null
console.log(SHELLVIZ_SHOW_URL);  // e.g., false or null  
console.log(SHELLVIZ_URL);       // e.g., "https://my-server.com" or null
```

## Boolean Values

For boolean configuration values, the following are considered `true`:
- `true` (boolean)
- `"true"` (string)
- `"1"` (string)
- `"yes"` (string)

All other values are considered `false`.

## Default Values

Default values are clearly visible in the constructor declarations:

```javascript
// Client defaults
constructor(opts = {}) // port defaults to 5544 from opts or DEFAULT_PORT

// Server defaults  
constructor({ port = 5544, showUrl = true } = {})
```

Environment variables and window variables automatically override these defaults when present.

## Browser Integration Example

```html
<!DOCTYPE html>
<html>
<head>
    <script>
        // Set config before importing ShellViz
        window.SHELLVIZ_PORT = 8080;
        window.SHELLVIZ_URL = "https://my-shellviz-server.com";
    </script>
</head>
<body>
    <script type="module">
        import { ShellvizClient } from './path/to/shellviz/client.js';
        
        // Will use the window variables set above
        const sv = new ShellvizClient();
        sv.log("Hello from browser!");
    </script>
</body>
</html>
``` 