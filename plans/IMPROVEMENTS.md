# Improvement Plans for @sudobility/mixr_api

## Priority 1 - High Impact

### 1. Add Zod Request Validation to All Route Handlers
- Route handlers parse request bodies with `c.req.json()` and then manually validate fields with `if` statements (e.g., `if (!stars || typeof stars !== 'number' || stars < 1 || stars > 5)`).
- The `/generate` route has ~30 lines of manual validation. The `/:id/ratings` POST has ~15 lines. This is error-prone and inconsistent.
- Zod is already a dependency (used in `src/config/env.ts`) and should be used for request body validation with `.safeParse()`, providing automatic error messages and type narrowing.
- Validation schemas could be shared with `mixr_types` if Zod schemas are added there, creating a single source of truth.

### 2. Replace Placeholder Unit Tests with Real Test Coverage
- The only unit test is `tests/unit/placeholder.test.ts`. Integration tests exist but require a running database.
- Route handlers contain significant business logic (recipe generation orchestration, rating upsert, user auto-creation, pagination) that should have unit tests with mocked database calls.
- `recipeGenerator.ts` (AI service) has no tests -- at minimum, prompt construction and response parsing should be tested with mocked OpenAI responses.
- `errorHandler.ts` and `auth.ts` middleware should have unit tests covering all branches (HTTPException vs generic Error, dev mode vs production, missing/invalid/expired tokens).

### 3. Fix N+1 Query Problem in Recipe List Endpoint
- The `GET /api/recipes` endpoint fetches all recipes, then calls `getCompleteRecipe()` for each one in a `Promise.all` loop.
- `getCompleteRecipe()` makes 4 separate database queries per recipe (recipe, mood, ingredients, steps+equipment).
- For a page of 10 recipes, this results in 1 + (10 x 4) = 41 database queries. This will degrade significantly as recipe count grows.
- The queries should be batched: fetch all moods, all recipe_ingredients, all recipe_steps, and all recipe_equipment for the recipe ID set in a single query each, then assemble in-memory.

## Priority 2 - Medium Impact

### 4. Add Rate Limiting Middleware
- The API has no rate limiting. The `/api/recipes/generate` endpoint calls OpenAI which has both cost and rate implications.
- Unauthenticated endpoints (`GET /api/equipment`, `GET /api/recipes`, etc.) are open to abuse.
- Hono has `hono/rate-limiter` or a simple in-memory/Redis-based rate limiter could be added, especially for the generation endpoint.

### 5. Improve Recipe Generation Resilience
- `recipeGenerator.ts` does `JSON.parse(content)` on the raw LLM response with no safety parsing (e.g., stripping markdown code fences, handling partial JSON).
- The model name is hardcoded (`'gpt-4'` or `'qwen-32b-everything'`) with no fallback if the model is unavailable.
- The function catches all errors and re-throws a generic `'Failed to generate recipe'`, losing the original error context (was it a JSON parse error? An API timeout? Rate limit?).
- LLM Studio does not support `response_format: { type: 'json_object' }` -- adding a JSON extraction regex fallback would improve reliability with local models.

### 6. Add Database Transaction for Recipe Creation
- The `POST /generate` route inserts into 4 tables sequentially (`recipes`, `recipe_ingredients`, `recipe_steps`, `recipe_equipment`) without a transaction.
- If an insert fails partway through, orphaned data is left in the database (e.g., a recipe with no steps).
- Wrapping the multi-table insert in a Drizzle transaction (`db.transaction(async (tx) => { ... })`) would ensure atomicity.

## Priority 3 - Nice to Have

### 7. Add Structured Logging
- Current logging uses `console.log` and `console.error` with no structured format.
- Adding a logger (e.g., `pino` or Hono's built-in logger with custom format) with request IDs, user IDs, and operation context would improve debugging and monitoring.
- Error logs in catch blocks (e.g., `console.error('Recipe generation error:', error)`) should include request context.

### 8. Add OpenAPI/Swagger Documentation
- The API has 20+ endpoints documented only in `CLAUDE.md` and the startup console output.
- Hono supports OpenAPI spec generation via `@hono/zod-openapi`, which could auto-generate interactive API docs from Zod schemas (if added per improvement #1).
- This would also enable auto-generated client types, reducing the manual type maintenance burden in `mixr_types`.

### 9. Tighten CORS Configuration
- CORS is configured as `origin: '*'`, allowing any domain to make authenticated requests.
- In production, this should be restricted to the actual frontend domain(s) to prevent CSRF-style attacks on authenticated endpoints.
