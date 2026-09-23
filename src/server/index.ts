/**
 * EcoTwin AI - Main Express Server Application
 */

import express, { Request, Response } from 'express';
import { db } from './db';
import { apiRouter } from './apiRouter';
import { aiPredictionService } from './services/aiPredictionService';

export const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize database & initial predictions
db.init().then(() => {
  console.log('[EcoTwin AI] Persistent database loaded.');
  // Ensure predictions exist
  const preds = db.getPredictions();
  if (!preds || preds.length === 0) {
    aiPredictionService.runBatchPredictions();
  }
});

const handlePing = (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    pong: true,
    timestamp: new Date().toISOString(),
  });
};

const handleHealth = (_req: Request, res: Response) => {
  const dbHealth = db.checkHealth();
  const uptimeSeconds = Math.floor(process.uptime());
  const hours = Math.floor(uptimeSeconds / 3600);
  const minutes = Math.floor((uptimeSeconds % 3600) / 60);
  const seconds = uptimeSeconds % 60;
  const mem = process.memoryUsage();

  const isHealthy = dbHealth.status === 'connected';

  res.status(isHealthy ? 200 : 503).json({
    status: isHealthy ? 'healthy' : 'degraded',
    uptime_seconds: uptimeSeconds,
    uptime_formatted: `${hours}h ${minutes}m ${seconds}s`,
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development',
    version: '1.0.0',
    database: dbHealth,
    services: {
      digital_twin: 'operational',
      ai_prediction: 'operational',
      route_optimization: 'operational',
      carbon_calculation: 'operational',
    },
    server_memory: {
      rss_mb: Math.round((mem.rss / 1024 / 1024) * 100) / 100,
      heap_used_mb: Math.round((mem.heapUsed / 1024 / 1024) * 100) / 100,
      heap_total_mb: Math.round((mem.heapTotal / 1024 / 1024) * 100) / 100,
    },
  });
};

// Support both /api/health/ping and /health/ping (and aliases)
app.get('/api/health/ping', handlePing);
app.get('/health/ping', handlePing);
app.get('/api/ping', handlePing);
app.get('/ping', handlePing);

// Support both /api/health and /health
app.get('/api/health', handleHealth);
app.get('/health', handleHealth);

// Mount the API Router
app.use('/api', apiRouter);

// Strict JSON 404 handler for any unhandled /api/* route - never return HTML for API calls
app.all('/api/*', (req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    error: `API endpoint '${req.method} ${req.path}' not found.`,
  });
});

export default app;
