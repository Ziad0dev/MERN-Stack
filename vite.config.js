import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// In development /api is proxied to the Mern-crud backend
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': process.env.API_URL || 'http://localhost:8000' } },
});
