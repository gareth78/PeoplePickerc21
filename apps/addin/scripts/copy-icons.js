#!/usr/bin/env node
const { mkdirSync, copyFileSync, existsSync } = require('node:fs');
const path = require('node:path');

const rootDir = path.resolve(__dirname, '../..');
const sourceDir = path.join(rootDir, 'web', 'public');
const destDir = path.resolve(__dirname, '../public/icons');
const files = [
  'favicon-16x16.png',
  'favicon-32x32.png',
  'android-chrome-192x192.png'
];

if (!existsSync(sourceDir)) {
  console.error(`Source directory not found: ${sourceDir}`);
  process.exit(1);
}

mkdirSync(destDir, { recursive: true });

for (const file of files) {
  const source = path.join(sourceDir, file);
  const dest = path.join(destDir, file);
  try {
    copyFileSync(source, dest);
    console.log(`Copied ${file}`);
  } catch (error) {
    console.error(`Failed to copy ${file}:`, error instanceof Error ? error.message : error);
    process.exitCode = 1;
  }
}
