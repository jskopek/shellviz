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

1. Make sure you have an npm account and are logged in:
```bash
npm login
```

2. Update the version in `package.json` if needed:
```bash
npm version patch  # for bug fixes
npm version minor  # for new features
npm version major  # for breaking changes
```

3. Build the package:
```bash
npm run build
npm run pack
```

4. Publish to npm:
```bash
npm publish
```

The package will be automatically built before publishing thanks to the `prepublishOnly` script in `package.json`.

To publish a beta/alpha version:
```bash
npm publish --tag beta
# or
npm publish --tag alpha
```

Users can then install specific versions:
```bash
npm install shellviz@beta
# or
npm install shellviz@alpha
```


