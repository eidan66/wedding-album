import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath, URL } from 'url';
import svgr from 'vite-plugin-svgr';


export default defineConfig({
  base: '/wedding-album/',
  plugins: [react(),svgr()],
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
});