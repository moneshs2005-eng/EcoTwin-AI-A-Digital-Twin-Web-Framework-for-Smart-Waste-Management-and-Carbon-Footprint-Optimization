/**
 * EcoTwin AI - Production & Development Full-Stack Server
 * Mounts Vite middleware during development and serves optimized static assets in production.
 */

import path from 'path';
import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import { app } from './src/server/index';

dotenv.config();

const PORT = Number(process.env.PORT) || 3000;
const isProd = process.env.NODE_ENV === 'production';
const DIST_DIR = path.resolve(process.cwd(), 'dist');

async function startServer() {
  if (!isProd) {
    // In development: mount Vite dev server as middleware
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('[EcoTwin AI] Vite middleware mounted in development mode');
  } else {
    // In production: serve pre-built static bundle
    app.use(express.static(DIST_DIR));

    // Fallback for SPA client-side routing
    app.get('*', (req: Request, res: Response, next: NextFunction) => {
      if (req.path.startsWith('/api')) {
        return next();
      }
      res.sendFile(path.join(DIST_DIR, 'index.html'), (err) => {
        if (err) {
          res.status(200).send('EcoTwin AI Server Running. Please build the frontend for production UI.');
        }
      });
    });
    console.log('[EcoTwin AI] Serving static production build from dist/');
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`[EcoTwin AI] Server running on http://0.0.0.0:${PORT} (${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('[EcoTwin AI] Failed to start server:', err);
  process.exit(1);
});
