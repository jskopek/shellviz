import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory
const rootDir = path.resolve(__dirname, '../');
const clientDist = path.join(rootDir, '../', '../', 'client', 'build');
const packageDist = path.join(rootDir, 'build', 'client_build');

// Remove the dist directory if it exists
if (fs.existsSync(packageDist)) {
    fs.rmSync(packageDist, { recursive: true, force: true });
    console.log(`Emptied directory: ${packageDist}`);
}

// Use fs.cpSync (Node.js 16+) to recursively copy everything from client/dist to dist
fs.cpSync(clientDist, packageDist, { recursive: true });
console.log(`Copied all files from ${clientDist} to ${packageDist}`);

// Copy type definitions
const typeSrc = path.join(rootDir, 'src', 'client.d.ts');
const typeDest = path.join(rootDir, 'build', 'client.d.ts');
fs.copyFileSync(typeSrc, typeDest);
console.log(`Copied types from ${typeSrc} to ${typeDest}`);
