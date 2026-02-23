import type { Context } from 'hono';
import { HTTPException } from 'hono/http-exception';

/**
 * Global error handler for the Hono application.
 * Catches all unhandled errors and returns a consistent JSON error response.
 *
 * - HTTPException: Returns the specific status code and message.
 * - Generic Error: Returns 500 with a generic message (hides internals).
 */
export async function errorHandler(err: Error, c: Context) {
  console.error('Error:', err);

  if (err instanceof HTTPException) {
    return c.json(
      {
        success: false,
        error: err.message,
      },
      err.status
    );
  }

  return c.json(
    {
      success: false,
      error: 'Internal server error',
    },
    500
  );
}
