const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function build() {
    // Get the project root directory
    const rootDir = path.resolve(__dirname, '../..');
    const clientDist = path.join(rootDir, 'client', 'build');
    const packageDist = path.join(__dirname, 'build', 'client_build');

    // Remove the dist directory if it exists
    if (fs.existsSync(packageDist)) {
        fs.rmSync(packageDist, { recursive: true, force: true });
        console.log(`Emptied directory: ${packageDist}`);
    }

    // Use fs.cpSync (Node.js 16+) to recursively copy everything from client/dist to dist
    fs.cpSync(clientDist, packageDist, { recursive: true });
    console.log(`Copied all files from ${clientDist} to ${packageDist}`);

    // Bundle node.js with utils.js using esbuild
    console.log('Bundling node.js with utils.js...');
    
    // Create CommonJS bundle (node.cjs)
    // - format=cjs: Output as CommonJS module (require/module.exports)
    // - platform=node: Target Node.js environment
    // - bundle: Include all dependencies (like utils.js) in the output
    // - banner: Add eslint-disable comment to prevent linting of generated code
    execSync('esbuild ./src/node.js --bundle --format=cjs --platform=node --outfile=build/node.cjs --banner:js="/* eslint-disable */"', { stdio: 'inherit' });
    
    // Create ESM bundle (node.js)
    // - format=esm: Output as ES Module (import/export)
    // - platform=node: Target Node.js environment
    // - bundle: Include all dependencies in the output
    // - Uses node.esm.js as entry point which re-exports all functions
    execSync('esbuild ./src/node.esm.js --bundle --format=esm --platform=node --outfile=build/node.js --banner:js="/* eslint-disable */"', { stdio: 'inherit' });

    // Copy TypeScript declarations
    console.log('Copying TypeScript declarations...');
    fs.copyFileSync(
        path.join(__dirname, 'src', 'node.d.ts'),
        path.join(__dirname, 'build', 'node.d.ts')
    );
}

// Run the build
build(); 