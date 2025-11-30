import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const OUTPUT_FILE = 'project_code_report.txt';
const TARGET_DIRS = ['src', 'supabase']; // Directories to include
const ROOT_FILES_TO_INCLUDE = [
    'package.json', 
    'vite.config.ts', 
    'tsconfig.json', 
    'tailwind.config.js', 
    'postcss.config.js',
    '.eslintrc.cjs',
    'index.html'
];

// Files/Folders to ignore
const IGNORE_PATTERNS = [
    'node_modules', 
    '.git', 
    'dist', 
    'package-lock.json',
    OUTPUT_FILE,
    'collect-code.js'
];

function shouldIgnore(filePath) {
    return IGNORE_PATTERNS.some(pattern => filePath.includes(pattern));
}

function appendFileContent(filePath, writeStream) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const relativePath = path.relative(__dirname, filePath);
        
        writeStream.write('\n' + '='.repeat(50) + '\n');
        writeStream.write(`FILE: ${relativePath}\n`);
        writeStream.write('='.repeat(50) + '\n\n');
        writeStream.write(content + '\n');
        console.log(`Added: ${relativePath}`);
    } catch (err) {
        console.error(`Error reading ${filePath}: ${err.message}`);
    }
}

function processDirectory(dirPath, writeStream) {
    if (!fs.existsSync(dirPath)) return;

    const items = fs.readdirSync(dirPath);

    items.forEach(item => {
        const fullPath = path.join(dirPath, item);
        
        if (shouldIgnore(fullPath)) return;

        const stat = fs.statSync(fullPath);

        if (stat.isDirectory()) {
            processDirectory(fullPath, writeStream);
        } else if (stat.isFile()) {
            // Only process text-based files usually found in web projects
            if (/\.(ts|tsx|js|jsx|css|html|json|sql|md)$/.test(item)) {
                appendFileContent(fullPath, writeStream);
            }
        }
    });
}

// Main execution
const writeStream = fs.createWriteStream(path.join(__dirname, OUTPUT_FILE));

console.log('Starting code collection...');

// 1. Process Root Files
ROOT_FILES_TO_INCLUDE.forEach(file => {
    const fullPath = path.join(__dirname, file);
    if (fs.existsSync(fullPath)) {
        appendFileContent(fullPath, writeStream);
    }
});

// 2. Process Directories
TARGET_DIRS.forEach(dir => {
    processDirectory(path.join(__dirname, dir), writeStream);
});

writeStream.end();
console.log(`\nDone! All// filepath: c:\Program Files\repos\anki\collect-code.js`)