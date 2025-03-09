import { join } from 'path';
import { fileURLToPath } from 'url';

const __dirname = fileURLToPath(new URL('.', import.meta.url));
console.log('Preload path:', join(__dirname, 'preload.cjs'));