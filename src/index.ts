import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { logger } from 'hono/logger';
import { prettyJSON } from 'hono/pretty-json';
import { errorHandler } from './middleware/errorHandler';
import { env } from './config/env';

// Import routes
import equipmentRoutes from './routes/equipment';
import ingredientsRoutes from './routes/ingredients';
import moodsRoutes from './routes/moods';
import recipesRoutes from './routes/recipes';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
app.use(
  '*',
  cors({
    origin: '*',
    allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowHeaders: ['Content-Type', 'Authorization'],
  })
);

// Error handling
app.onError(errorHandler);

// Health check
app.get('/', (c) => {
  return c.json({
    success: true,
    message: 'MIXR API is running',
    version: '0.0.1',
  });
});

app.get('/health', (c) => {
  return c.json({
    success: true,
    status: 'healthy',
    timestamp: new Date().toISOString(),
  });
});

// API Routes
app.route('/api/equipment', equipmentRoutes);
app.route('/api/ingredients', ingredientsRoutes);
app.route('/api/moods', moodsRoutes);
app.route('/api/recipes', recipesRoutes);

// 404 handler
app.notFound((c) => {
  return c.json(
    {
      success: false,
      error: 'Route not found',
    },
    404
  );
});

// Start server
const port = parseInt(env.PORT);

console.log(`
╔════════════════════════════════════════╗
║                                        ║
║     🍸 MIXR API Server Starting 🍸     ║
║                                        ║
╚════════════════════════════════════════╝

Environment: ${env.NODE_ENV}
Port: ${port}
API: http://localhost:${port}
Health: http://localhost:${port}/health

Available endpoints:
  GET    /api/equipment
  GET    /api/equipment/:id
  GET    /api/equipment/subcategories

  GET    /api/ingredients
  GET    /api/ingredients/:id
  GET    /api/ingredients/subcategories

  GET    /api/moods
  GET    /api/moods/:id

  POST   /api/recipes/generate
  GET    /api/recipes
  GET    /api/recipes/:id

Ready to mix some cocktails! 🎉
`);

export default {
  port,
  fetch: app.fetch,
};
