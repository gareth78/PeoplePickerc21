import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'node:path';
import type { ServerOptions as HttpsServerOptions } from 'node:https';

const httpsOption: HttpsServerOptions = {};

export default defineConfig({
  plugins: [basicSsl(), react()],
  server: {
    host: 'localhost',
    port: 5173,
    strictPort: true,
    https: httpsOption,
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: false,
      },
    },
  },
  preview: {
    https: httpsOption,
    port: 4173,
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    sourcemap: true,
    rollupOptions: {
      input: {
        taskpane: resolve(__dirname, 'index.html'),
        commands: resolve(__dirname, 'commands.html'),
      },
    },
  },
});
