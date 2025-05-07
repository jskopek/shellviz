# Shellviz Javascript Package
----------------------------

# Installation

`npm install shellviz`

# Usage

```
import { log } from 'shellviz';
log('hell world')
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
cd ../node
npm install
npm run build
```

3. To create a local package for testing:
```bash
npm run pack  # Creates shellviz-0.4.2.tgz in the ../build directory
```

4. To test locally, you can create a test directory and install the package:
```bash
mkdir test
cd test
npm init -y
npm install ../../build/shellviz-0.4.2.tgz
```

5. Create a test file (e.g., `test.js` or `test.mjs`) and run it:
```bash
# For CommonJS
node test.js

# For ES Modules
node test.mjs
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


