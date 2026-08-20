const fs = require('fs');
const path = require('path');

const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');

function ensureDir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

function copyRecursive(sourcePath, destinationPath) {
  const stat = fs.statSync(sourcePath);

  if (stat.isDirectory()) {
    ensureDir(destinationPath);

    for (const entry of fs.readdirSync(sourcePath)) {
      copyRecursive(path.join(sourcePath, entry), path.join(destinationPath, entry));
    }

    return;
  }

  ensureDir(path.dirname(destinationPath));
  fs.copyFileSync(sourcePath, destinationPath);
}

fs.rmSync(distDir, { recursive: true, force: true });

for (const entry of fs.readdirSync(rootDir, { withFileTypes: true })) {
  if (entry.isFile() && entry.name.endsWith('.html')) {
    copyRecursive(path.join(rootDir, entry.name), path.join(distDir, entry.name));
  }
}

copyRecursive(path.join(rootDir, 'assets'), path.join(distDir, 'assets'));

console.log('Built static site to dist/.');