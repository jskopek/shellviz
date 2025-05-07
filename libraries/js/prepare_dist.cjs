const fs = require('fs');
const path = require('path');

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

    // Copy the main index.js file as index.cjs
    const sourceFile = path.join(__dirname, 'src', 'node.js');
    const cjsFile = path.join(packageDist, 'node.cjs');
    fs.mkdirSync(path.dirname(cjsFile), { recursive: true });
    fs.copyFileSync(sourceFile, cjsFile);

    // Create ES module wrapper (index.js)
    const esmContent = `// ES Module wrapper for shellviz
import shellviz from './node.cjs';

export const {
    send,
    clear,
    wait,
    log,
    json,
    table,
    markdown,
    bar,
    Shellviz
} = shellviz;
`;

    fs.writeFileSync(path.join(packageDist, 'node.js'), esmContent);

    // Generate TypeScript declaration file
    const dtsContent = `declare module 'shellviz' {
    export function send(data: any, options?: { id?: string; view?: string; append?: boolean; wait?: boolean }): Promise<void>;
    export function clear(): void;
    export function wait(): Promise<void>;
    export function log(data: any, id?: string): void;
    export function json(data: any, id?: string): void;
    export function table(data: any, id?: string): void;
    export function markdown(data: any, id?: string): void;
    export function bar(data: any, id?: string): void;
    export function Shellviz(): any;
}`;

    fs.writeFileSync(path.join(packageDist, 'node.d.ts'), dtsContent);
}

// Run the build
build(); 