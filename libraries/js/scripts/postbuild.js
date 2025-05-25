// console.log('temporarily ignoring - copy:client does the same thing')
// return;


import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// ESM-compatible __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Get the project root directory
const rootDir = path.resolve(__dirname, '../');

// Copy type definitions
const typeSrc = path.join(rootDir, 'src', 'client.d.ts');
const typeDest = path.join(rootDir, 'build', 'client.d.ts');

if (fs.existsSync(typeSrc)) {
  fs.copyFileSync(typeSrc, typeDest);
  console.log(`✅ Copied types from ${typeSrc} to ${typeDest}`);
}

// Check build sizes
const buildDir = path.join(rootDir, 'build');
const files = ['browser_client.mjs', 'browser_client.umd.js', 'node_client.cjs', 'node_client.js', 'embedded-assets.mjs'];

console.log('\n📊 Build sizes:');
files.forEach(file => {
  const filePath = path.join(buildDir, file);
  if (fs.existsSync(filePath)) {
    const stats = fs.statSync(filePath);
    const sizeKB = (stats.size / 1024).toFixed(1);
    console.log(`   ${file}: ${sizeKB}KB`);
  }
});

console.log('\n💡 Note: embedded-assets.mjs is now separate for smaller main bundles!');
