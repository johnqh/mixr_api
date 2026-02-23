# Improvement Plans for @sudobility/mixr_api

## Priority 1 - High Impact

### 1. Add Zod Request Validation to All Route Handlers ✅

**Status: Completed**

- Created `src/validation/schemas.ts` with Zod schemas for all request bodies and query parameters: `generateRecipeSchema`, `submitRatingSchema`, `updateUserSchema`, `updatePreferencesSchema`, `addFavoriteSchema`, `paginationSchema`, `ratingsQuerySchema`.
- Replaced all manual `if`/`typeof` validation in `routes/recipes.ts` and `routes/users.ts` with `.safeParse()` calls.
- Error messages are now auto-generated from Zod and consistently formatted.
- Inferred TypeScript types are exported alongside schemas.

### 2. Replace Placeholder Unit Tests with Real Test Coverage ✅

**Status: Completed**

- Added `tests/unit/recipeGenerator.test.ts` (17 tests): covers `extractJson`, `parseRecipeResponse`, and `buildRecipePrompt` pure functions.
- Added `tests/unit/validation.test.ts` (33 tests): covers all Zod schemas with valid/invalid inputs, edge cases, coercion, and defaults.
- Added `tests/unit/errorHandler.test.ts` (4 tests): covers `HTTPException` handling, generic error handling, and secret leakage prevention.
- Extracted pure functions from `recipeGenerator.ts` into `recipeParser.ts` to enable testing without env/OpenAI dependencies.
- Total: 55 unit tests passing (up from 1 placeholder).

### 3. Fix N+1 Query Problem in Recipe List Endpoint ✅

**Status: Completed**

- Added `getCompleteRecipes()` batch function in both `routes/recipes.ts` and `routes/users.ts`.
- For a page of 10 recipes, queries dropped from 41 (1 + 10x4) to 5 (recipes + moods + ingredients + steps + equipment) using `inArray()` batch fetches.
- Results are grouped by recipe ID in-memory using `Map` structures.
- Applied to `GET /api/recipes`, `GET /api/users/me/recipes`, and `GET /api/users/me/favorites`.

## Priority 2 - Medium Impact

### 4. Add Rate Limiting Middleware

**Status: Deferred** -- Requires Redis or persistent store for production-grade rate limiting. In-memory rate limiting is not suitable for multi-instance deployments.

- The API has no rate limiting. The `/api/recipes/generate` endpoint calls OpenAI which has both cost and rate implications.
- Unauthenticated endpoints (`GET /api/equipment`, `GET /api/recipes`, etc.) are open to abuse.
- Hono has `hono/rate-limiter` or a simple in-memory/Redis-based rate limiter could be added, especially for the generation endpoint.

### 5. Improve Recipe Generation Resilience ✅

**Status: Completed**

- Created `src/services/recipeParser.ts` with pure utility functions for JSON extraction and response parsing.
- `extractJson()` handles markdown code fences (`\`\`\`json`), bare fences, and JSON embedded in surrounding text.
- `parseRecipeResponse()` provides specific error messages for each missing field instead of a generic "Invalid recipe format".
- Error context is preserved: API errors, JSON parse errors, and validation errors each throw with distinct messages.
- `generateRecipe()` now separates API call errors from parsing errors for clearer debugging.

### 6. Add Database Transaction for Recipe Creation ✅

**Status: Completed**

- Wrapped the 4-table insert (`recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_equipment`) in `db.transaction()` in `POST /generate`.
- If any insert fails, all changes are rolled back -- no more orphaned recipes without steps/ingredients.
- Also converted sequential per-row inserts to batch `insert().values([...])` calls within the transaction for fewer round trips.

## Priority 3 - Nice to Have

### 7. Add Structured Logging

**Status: Deferred** -- Requires adding a new dependency (pino) and restructuring all log calls. Better done as a dedicated effort.

- Current logging uses `console.log` and `console.error` with no structured format.
- Adding a logger (e.g., `pino` or Hono's built-in logger with custom format) with request IDs, user IDs, and operation context would improve debugging and monitoring.
- Error logs in catch blocks (e.g., `console.error('Recipe generation error:', error)`) should include request context.

### 8. Add OpenAPI/Swagger Documentation

**Status: Deferred** -- Major architectural addition requiring `@hono/zod-openapi` migration. Better done after all Zod schemas are stabilized.

- The API has 20+ endpoints documented only in `CLAUDE.md` and the startup console output.
- Hono supports OpenAPI spec generation via `@hono/zod-openapi`, which could auto-generate interactive API docs from Zod schemas (if added per improvement #1).
- This would also enable auto-generated client types, reducing the manual type maintenance burden in `mixr_types`.

### 9. Tighten CORS Configuration ✅

**Status: Completed**

- Added `CORS_ORIGINS` env var to `src/config/env.ts` (optional, comma-separated list of allowed origins).
- `src/index.ts` now reads `CORS_ORIGINS` and passes it to `cors()` middleware. Defaults to `'*'` when not set (development behavior).
- In production, set `CORS_ORIGINS=https://app.mixr.com,https://mixr.com` to restrict access.

## Additional Improvements Made

### JSDoc Documentation
- Added JSDoc comments to all route handlers, middleware functions, service functions, and exported interfaces across all modified files.
- Documents parameters, return values, error conditions, and behavioral notes.

### Code Organization
- Extracted pure functions (`extractJson`, `parseRecipeResponse`, `buildRecipePrompt`) into `src/services/recipeParser.ts` for testability.
- `recipeGenerator.ts` re-exports all types and functions from `recipeParser.ts` for backward-compatible imports.
- Created `src/validation/schemas.ts` as a centralized location for all request validation schemas.

### Batch Inserts in Recipe Creation
- Converted sequential single-row inserts for ingredients, steps, and equipment into batch `insert().values([...])` calls.
- Reduces database round trips from N inserts to 3 batch inserts during recipe creation.
