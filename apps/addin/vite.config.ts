import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import basicSsl from '@vitejs/plugin-basic-ssl';
import { resolve } from 'node:path';
import { copyFileSync, existsSync } from 'node:fs';
import type { ServerOptions as HttpsServerOptions } from 'node:https';

const httpsOption: HttpsServerOptions = {};

export default defineConfig({
  publicDir: 'public',
  plugins: [
    basicSsl(),
    react(),
    {
      name: 'copy-static-config',
      writeBundle() {
        const configPath = resolve(__dirname, 'staticwebapp.config.json');
        const destPath = resolve(__dirname, 'dist/staticwebapp.config.json');
        if (existsSync(configPath)) {
          copyFileSync(configPath, destPath);
          console.log('✓ Copied staticwebapp.config.json to dist/');
        } else {
          console.warn('⚠ staticwebapp.config.json not found');
        }
      }
    }
  ],
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
