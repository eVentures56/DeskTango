// test-paths.js
import { resolve } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
console.log('main.js:', resolve(__dirname, 'main.js'));
console.log('preload.js:', resolve(__dirname, 'preload.js'));
console.log('index.html:', resolve(__dirname, 'index.html'));