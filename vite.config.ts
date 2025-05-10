import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';
import svgr from 'vite-plugin-svgr';
import vercel from 'vite-plugin-vercel';


export default defineConfig({
  base: '/wedding-album/',
  plugins: [react(),svgr(), vercel({
    basePath: '/wedding-album',
    includeFiles: true,
  }),
],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});