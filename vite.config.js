import { defineConfig } from 'vite';
import react    from '@vitejs/plugin-react';
import express  from 'express';
import apiRouter from './api.js';

// Mini Express app so req/res get Express extensions (res.json, res.status, etc.)
// This is only used by the Vite dev server; production uses server.js directly.
const _apiApp = express();
_apiApp.use(express.json({ limit: '10mb' }));
_apiApp.use(apiRouter);

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'api-dev',
      configureServer(devServer) {
        devServer.middlewares.use('/api', _apiApp);
      },
    },
  ],
  server: {
    port: 5500,
    host: true,
    strictPort: false,
  },
});
