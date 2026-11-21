import { fileURLToPath } from 'node:url';

import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ command, mode }) => {
  const env = loadEnv(mode, process.cwd(), '');

  if (command === 'build' && !env.VITE_API_BASE_URL) {
    throw new Error('VITE_API_BASE_URL must be set for production builds.');
  }

  return {
    // Set VITE_BASE when the site is served from a sub-path (GitHub Pages project sites).
    base: env.VITE_BASE?.trim() || '/',
    plugins: [react(), tailwindcss()],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5173,
      strictPort: true,
      // Optional local proxy so `VITE_API_BASE_URL=/api` can reach a remote API
      // without loosening that API's CORS allow-list.
      proxy: env.VITE_DEV_PROXY
        ? {
            '/api': {
              target: env.VITE_DEV_PROXY,
              changeOrigin: true,
              secure: true,
            },
          }
        : undefined,
    },
    preview: {
      port: 4173,
      strictPort: true,
    },
  };
});
