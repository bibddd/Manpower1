import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: './',
  define: {
    global: 'globalThis',
  },
  server: {
    port: 5173,
    open: false,
  },
  optimizeDeps: {
    include: ['xlsx', 'papaparse'],
  },
});
