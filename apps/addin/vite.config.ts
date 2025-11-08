import { defineConfig, loadEnv, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'node:fs';
import path from 'node:path';

const manifestPlugin = (): Plugin => ({
  name: 'peoplepicker-manifest',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      if (req.url === '/manifest.xml') {
        const manifestPath = path.resolve(__dirname, 'manifest.xml');
        try {
          const xml = await fs.promises.readFile(manifestPath);
          res.setHeader('Content-Type', 'application/xml');
          res.statusCode = 200;
          res.end(xml);
          return;
        } catch (error) {
          console.error('Unable to read manifest.xml', error);
          res.statusCode = 500;
          res.end('Manifest not found');
          return;
        }
      }
      next();
    });
  },
  generateBundle() {
    const manifestPath = path.resolve(__dirname, 'manifest.xml');
    const source = fs.readFileSync(manifestPath, 'utf8');
    this.emitFile({
      type: 'asset',
      fileName: 'manifest.xml',
      source
    });
  }
});

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const baseUrl = env.NEXT_PUBLIC_PEOPLEPICKER_BASE_URL || '';

  return {
    plugins: [react(), manifestPlugin()],
    envPrefix: ['NEXT_PUBLIC_', 'VITE_'],
    resolve: {
      alias: {
        '@peoplepicker/sdk': path.resolve(__dirname, '../../packages/sdk/src')
      }
    },
    server: {
      host: '0.0.0.0',
      port: 5173,
      proxy: baseUrl
        ? undefined
        : {
            '/api': {
              target: 'http://localhost:3000',
              changeOrigin: true
            }
          }
    },
    build: {
      outDir: 'dist',
      emptyOutDir: true
    }
  };
});
