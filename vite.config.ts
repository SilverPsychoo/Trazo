import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/postcss';
import { fileURLToPath } from 'node:url';

export default defineConfig({
  base: './',
  plugins: [react()],
  resolve: {
    alias: { '@': fileURLToPath(new URL('.', import.meta.url)) },
  },
  css: {
    postcss: { plugins: [tailwindcss()] },
  },
  worker: { format: 'es' },
  optimizeDeps: {
    exclude: [
      'onnxruntime-web',
      '@jsquash/jpeg',
      '@jsquash/oxipng',
      '@jsquash/webp',
      '@jsquash/avif',
    ],
  },
  build: {
    outDir: 'dist',
    target: 'es2022',
    assetsInlineLimit: 0,
    chunkSizeWarningLimit: 1800,
  },
});
