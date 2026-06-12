import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In dev, proxy /api to the backend so the browser talks to a single origin.
// In Docker, nginx serves the build and proxies /api to the api service.
export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    proxy: {
      '/api': {
        target: process.env.VITE_API_TARGET ?? 'http://localhost:4000',
        changeOrigin: true,
      },
    },
  },
});
