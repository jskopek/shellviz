#!/usr/bin/env node

/**
 * Script to embed React app assets into a JavaScript module
 * This allows the browser widget to work without a server
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const CLIENT_BUILD_PATH = path.join(__dirname, '../build/client_build');
const OUTPUT_PATH = path.join(__dirname, '../src/embedded-assets.js');

async function embedAssets() {
  console.log('Embedding React app assets...');
  
  try {
    // Read asset manifest
    const manifestPath = path.join(CLIENT_BUILD_PATH, 'asset-manifest.json');
    if (!fs.existsSync(manifestPath)) {
      console.warn('Asset manifest not found. Make sure the React app is built.');
      console.warn('Expected path:', manifestPath);
      return;
    }
    
    const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
    
    // Read CSS file
    const cssFile = manifest.files['main.css'];
    const cssPath = path.join(CLIENT_BUILD_PATH, cssFile);
    const cssContent = fs.existsSync(cssPath) ? fs.readFileSync(cssPath, 'utf8') : '';
    
    // Read JS file
    const jsFile = manifest.files['main.js'];
    const jsPath = path.join(CLIENT_BUILD_PATH, jsFile);
    const jsContent = fs.existsSync(jsPath) ? fs.readFileSync(jsPath, 'utf8') : '';
    
    // Read index.html
    const indexPath = path.join(CLIENT_BUILD_PATH, 'index.html');
    const indexContent = fs.existsSync(indexPath) ? fs.readFileSync(indexPath, 'utf8') : '';
    
    // Generate the embedded assets module
    const output = `// Auto-generated file - DO NOT EDIT
// This file contains embedded React app assets for the browser widget

export const EMBEDDED_ASSETS = {
  manifest: ${JSON.stringify(manifest, null, 2)},
  css: ${JSON.stringify(cssContent)},
  js: ${JSON.stringify(jsContent)},
  html: ${JSON.stringify(indexContent)},
  timestamp: ${Date.now()}
};

export function hasEmbeddedAssets() {
  return EMBEDDED_ASSETS.css.length > 0 && EMBEDDED_ASSETS.js.length > 0;
}

export function getEmbeddedCSS() {
  return EMBEDDED_ASSETS.css;
}

export function getEmbeddedJS() {
  return EMBEDDED_ASSETS.js;
}

export function getEmbeddedHTML() {
  return EMBEDDED_ASSETS.html;
}
`;

    // Write the output file
    fs.writeFileSync(OUTPUT_PATH, output, 'utf8');
    
    console.log('✅ Assets embedded successfully!');
    console.log(`📁 CSS size: ${(cssContent.length / 1024).toFixed(1)}KB`);
    console.log(`📁 JS size: ${(jsContent.length / 1024).toFixed(1)}KB`);
    console.log(`📄 Output: ${OUTPUT_PATH}`);
    
  } catch (error) {
    console.error('❌ Error embedding assets:', error.message);
    process.exit(1);
  }
}

embedAssets(); 