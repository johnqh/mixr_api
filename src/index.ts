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
import usersRoutes from './routes/users';

const app = new Hono();

// Middleware
app.use('*', logger());
app.use('*', prettyJSON());
// CORS: use CORS_ORIGINS env var in production, '*' in development
const corsOrigin = env.CORS_ORIGINS
  ? env.CORS_ORIGINS.split(',').map((o) => o.trim())
  : '*';
app.use(
  '*',
  cors({
    origin: corsOrigin,
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
app.route('/api/users', usersRoutes);

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

  POST   /api/recipes/generate (🔐 auth required)
  GET    /api/recipes
  GET    /api/recipes/:id
  POST   /api/recipes/:id/ratings (🔐 auth required)
  GET    /api/recipes/:id/ratings
  GET    /api/recipes/:id/ratings/aggregate
  DELETE /api/recipes/:recipeId/ratings/:ratingId (🔐 auth required)

  GET    /api/users/me (🔐 auth required)
  PUT    /api/users/me (🔐 auth required)
  GET    /api/users/me/preferences (🔐 auth required)
  PUT    /api/users/me/preferences (🔐 auth required)
  GET    /api/users/me/recipes (🔐 auth required)
  GET    /api/users/me/favorites (🔐 auth required)
  POST   /api/users/me/favorites (🔐 auth required)
  DELETE /api/users/me/favorites/:recipeId (🔐 auth required)

🔐 = Requires Firebase authentication token

Ready to mix some cocktails! 🎉
`);

export default {
  port,
  fetch: app.fetch,
};
