import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  base: '/', // ← root of subdomain, not a subfolder
  server: {
    host: true,
    port: 3001,
  },
});
