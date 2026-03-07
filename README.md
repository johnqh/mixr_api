# MIXR API

Backend API server for MIXR -- an AI-powered cocktail recipe generation platform.

## Tech Stack

- **Runtime**: Bun + Hono
- **Database**: PostgreSQL with Drizzle ORM
- **Auth**: Firebase Admin SDK
- **AI**: OpenAI GPT-4 (or LM Studio for local dev)
- **Validation**: Zod

## Setup

```bash
bun install
cp .env.local.example .env.local   # Configure DATABASE_URL, OPENAI_API_KEY, Firebase credentials
bun run db:generate                # Generate migrations
bun run db:migrate                 # Run migrations
bun run db:seed                    # Seed equipment (26), ingredients (52), moods (8)
bun run dev                        # Start dev server on port 6174
```

## Development

```bash
bun run dev          # Dev server with hot reload
bun run start        # Production server
bun run build        # Build for production
bun run test         # Run Vitest
bun run lint         # ESLint check
bun run typecheck    # TypeScript check
bun run db:studio    # Open Drizzle Studio
```

## API Routes

All routes under `/api/`. Response format: `{ success, data, error?, count? }`

### Public

- `GET /api/equipment` -- list (optional `?subcategory=` filter)
- `GET /api/equipment/:id`, `GET /api/equipment/subcategories`
- `GET /api/ingredients` -- list (optional `?subcategory=` filter)
- `GET /api/ingredients/:id`, `GET /api/ingredients/subcategories`
- `GET /api/moods`, `GET /api/moods/:id`
- `GET /api/recipes` -- paginated (`?limit=&offset=`)
- `GET /api/recipes/:id` -- with ingredients, steps, equipment

### Auth Required

- `POST /api/recipes/generate` -- AI-generate a recipe
- `POST /api/recipes/:id/ratings` -- submit rating (upsert)
- `GET /api/recipes/:id/ratings`, `GET /api/recipes/:id/ratings/aggregate`
- `DELETE /api/recipes/:recipeId/ratings/:ratingId`
- `GET /api/users/me`, `PUT /api/users/me`
- `GET/PUT /api/users/me/preferences`
- `GET /api/users/me/recipes`, `GET /api/users/me/favorites`
- `POST /api/users/me/favorites`, `DELETE /api/users/me/favorites/:recipeId`

### Health

- `GET /`, `GET /health`

## Environment Variables

Required in `.env.local`:

```bash
DATABASE_URL=postgresql://user:pass@localhost:5432/mixr
OPENAI_API_KEY=sk-...
PORT=6174
# Firebase Admin credentials
FIREBASE_PROJECT_ID=...
FIREBASE_CLIENT_EMAIL=...
FIREBASE_PRIVATE_KEY="..."
```

## Related Packages

- `@sudobility/mixr_types` -- shared type definitions
- `@sudobility/mixr_client` -- API client library
- `mixr` -- frontend web app

## License

MIT
