# MIXR API

Backend API server for MIXR - AI-powered cocktail recipe generation platform.

## Tech Stack

- **Language**: TypeScript
- **Runtime**: Bun
- **Package Manager**: Bun (do not use npm/yarn/pnpm for installing dependencies)
- **Framework**: Hono (fast web framework)
- **Database**: PostgreSQL with Drizzle ORM (schema: `mixr`)
- **Auth**: Firebase Admin SDK (dev mode fallback with mock user)
- **AI**: OpenAI GPT-4 (or LM Studio for local dev)
- **Validation**: Zod

## Project Structure

```
src/
├── index.ts              # Entry point, Hono app setup, server start
├── config/
│   ├── env.ts            # Env var loading with Zod validation
│   └── firebase.ts       # Firebase Admin initialization
├── db/
│   ├── index.ts          # Drizzle instance & PostgreSQL connection
│   ├── schema.ts         # 9 tables with relations
│   ├── migrate.ts        # Run migrations
│   └── seed.ts           # Seed equipment (26), ingredients (52), moods (8)
├── middleware/
│   ├── auth.ts           # requireAuth, optionalAuth (dev mock: dev-user-123)
│   └── errorHandler.ts   # Global error handler
├── routes/
│   ├── equipment.ts      # GET /api/equipment, /:id, /subcategories
│   ├── ingredients.ts    # GET /api/ingredients, /:id, /subcategories
│   ├── moods.ts          # GET /api/moods, /:id
│   ├── recipes.ts        # POST generate, GET list/detail, ratings CRUD
│   └── users.ts          # GET/PUT me, preferences, recipes, favorites
├── services/
│   └── recipeGenerator.ts # OpenAI/LM Studio recipe generation
└── types/
    └── index.ts          # ApiResponse, subcategory types
tests/
└── unit/
    └── placeholder.test.ts
drizzle/
└── migrations/           # Auto-generated SQL migrations
```

## Commands

```bash
bun run dev          # Start dev server with hot reload
bun run start        # Start production server
bun run build        # Build for production (bun build)
bun run start:prod   # Run production build
bun run test         # Run unit tests (vitest)
bun run test:integration # Run integration tests
bun run lint         # Run ESLint
bun run typecheck    # TypeScript type check
bun run format       # Format with Prettier
bun run db:generate  # Generate migrations from schema
bun run db:migrate   # Run migrations
bun run db:seed      # Seed database
bun run db:studio    # Open Drizzle Studio
```

## Database

Uses PostgreSQL with a `mixr` schema. Tables:

| Table | Purpose |
|-------|---------|
| `equipment` | Bar tools (26 items, 4 subcategories) |
| `ingredients` | Cocktail ingredients (52 items, 6 subcategories) |
| `moods` | Mood options for recipe generation (8 items) |
| `users` | Firebase UID mapping |
| `user_preferences` | Equipment/ingredient ID arrays |
| `recipes` | AI-generated recipes |
| `recipe_ingredients` | Recipe-ingredient join with amounts |
| `recipe_steps` | Ordered instructions |
| `recipe_equipment` | Recipe-equipment join |
| `recipe_ratings` | User ratings (1-5 stars + review) |
| `user_favorites` | Favorited recipes |

## Environment Variables

Required in `.env.local`:

```bash
# Database
DATABASE_URL=postgresql://user:pass@localhost:5432/mixr

# Firebase Admin
FIREBASE_PROJECT_ID=your-project-id
FIREBASE_CLIENT_EMAIL=firebase-adminsdk@...
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."

# AI (one of these)
OPENAI_API_KEY=sk-...
LLM_STUDIO_ENDPOINT=http://localhost:1234/v1  # Optional local dev

# Server
PORT=6174
NODE_ENV=development
```

Env loading priority: `.env.local` > `.env` > `process.env`

## API Routes

All routes under `/api/`:

### Equipment
- `GET /api/equipment` - List (optional `?subcategory=` filter)
- `GET /api/equipment/:id` - Get by ID
- `GET /api/equipment/subcategories` - List subcategories

### Ingredients
- `GET /api/ingredients` - List (optional `?subcategory=` filter)
- `GET /api/ingredients/:id` - Get by ID
- `GET /api/ingredients/subcategories` - List subcategories

### Moods
- `GET /api/moods` - List all
- `GET /api/moods/:id` - Get by ID

### Recipes (auth required for POST/DELETE)
- `POST /api/recipes/generate` - AI-generate recipe
- `GET /api/recipes` - List (paginated: `?limit=&offset=`)
- `GET /api/recipes/:id` - Get with ingredients, steps, equipment
- `POST /api/recipes/:id/ratings` - Submit rating (upsert)
- `GET /api/recipes/:id/ratings` - List ratings
- `GET /api/recipes/:id/ratings/aggregate` - Average + distribution
- `DELETE /api/recipes/:recipeId/ratings/:ratingId` - Delete own rating

### Users (all auth required)
- `GET /api/users/me` - Current user (auto-create on first call)
- `PUT /api/users/me` - Update profile
- `GET /api/users/me/preferences` - Get preferences
- `PUT /api/users/me/preferences` - Update preferences
- `GET /api/users/me/recipes` - User's generated recipes
- `GET /api/users/me/favorites` - Favorited recipes
- `POST /api/users/me/favorites` - Add favorite
- `DELETE /api/users/me/favorites/:recipeId` - Remove favorite

### Health
- `GET /` - Health check
- `GET /health` - Health check

## Code Patterns

### Route Handler
```typescript
app.get('/api/equipment', async (c) => {
  const subcategory = c.req.query('subcategory');
  const result = await db.select().from(equipment)
    .where(subcategory ? eq(equipment.subcategory, subcategory) : undefined);
  return c.json({ success: true, data: result, count: result.length });
});
```

### Auth Middleware
```typescript
app.post('/api/recipes/generate', requireAuth, async (c) => {
  const userId = c.get('userId');  // From Firebase token
  // ...
});
```

### Response Format
```json
{ "success": true, "data": [...], "count": 5 }
{ "success": false, "error": "Not found" }
```

## Key Dependencies

- `@sudobility/mixr_types` - Shared TypeScript types
- `@sudobility/types` - Common Sudobility types
- `hono` - Fast web framework
- `drizzle-orm` - Type-safe ORM
- `postgres` - PostgreSQL driver
- `zod` - Schema validation
- `firebase-admin` - Auth verification
- `openai` - LLM API client

## Middleware Chain

`logger()` -> `prettyJSON()` -> `cors(*)` -> `errorHandler` -> routes

## Docker

Dockerfile included for CI/CD. Uses `oven/bun:latest`, exposes port 6174, health check at `/health`.
