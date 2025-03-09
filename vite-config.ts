import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  server: {
    port: 5173,
    strictPort: true // Fail if port is occupied
  },
  build: {
    rollupOptions: {
      input: 'index.html'
    }
  }
});