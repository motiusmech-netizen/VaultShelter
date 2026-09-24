import { defineConfig } from 'vite';
import preact from '@preact/preset-vite';

// Relative base so the build works from any folder (Yandex Games serves the zip contents from a sub-path).
export default defineConfig({
  base: './',
  plugins: [preact()],
  build: {
    target: 'es2019',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 2000,
    sourcemap: false,
  },
  server: { host: true, port: 5173 },
});
