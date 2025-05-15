const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

function build() {
    // Get the project root directory
    const rootDir = path.resolve(__dirname, '../..');
    const clientDist = path.join(rootDir, 'client', 'dist');
    const packageDist = path.join(__dirname, 'dist');

    // Check if client/dist exists and has required files
    const requiredFiles = [
        'index.html',
        'static/js/main.js',
        'static/css/main.css'
    ];

    const missingFiles = requiredFiles.filter(file => 
        !fs.existsSync(path.join(clientDist, file))
    );

    if (missingFiles.length > 0) {
        throw new Error(
            'Missing required client/dist files. Please run the client build script first.\n' +
            `Missing files: ${missingFiles.join(', ')}\n` +
            `Folder: ${clientDist}`
        );
    }

    // Create necessary directories
    requiredFiles.forEach(file => {
        const targetPath = path.join(packageDist, file);
        fs.mkdirSync(path.dirname(targetPath), { recursive: true });
        console.log(`Copying ${path.join(clientDist, file)} to ${targetPath}`);
        fs.copyFileSync(path.join(clientDist, file), targetPath);
    });

    // Bundle node.js with utils.js using esbuild
    console.log('Bundling node.js with utils.js...');
    
    // Create CommonJS bundle (node.cjs)
    // - format=cjs: Output as CommonJS module (require/module.exports)
    // - platform=node: Target Node.js environment
    // - bundle: Include all dependencies (like utils.js) in the output
    // - banner: Add eslint-disable comment to prevent linting of generated code
    execSync('esbuild ./src/node.js --bundle --format=cjs --platform=node --outfile=dist/node.cjs --banner:js="/* eslint-disable */"', { stdio: 'inherit' });
    
    // Create ESM bundle (node.js)
    // - format=esm: Output as ES Module (import/export)
    // - platform=node: Target Node.js environment
    // - bundle: Include all dependencies in the output
    // - Uses node.esm.js as entry point which re-exports all functions
    execSync('esbuild ./src/node.esm.js --bundle --format=esm --platform=node --outfile=dist/node.js --banner:js="/* eslint-disable */"', { stdio: 'inherit' });

    // Copy TypeScript declarations
    console.log('Copying TypeScript declarations...');
    fs.copyFileSync(
        path.join(__dirname, 'src', 'node.d.ts'),
        path.join(packageDist, 'node.d.ts')
    );
}

// Run the build
build(); 