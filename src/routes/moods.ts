import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, moods } from '../db';

const app = new Hono();

// Get all moods
app.get('/', async (c) => {
  try {
    const results = await db.select().from(moods);

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to fetch moods',
      },
      500
    );
  }
});

// Get mood by ID
app.get('/:id', async (c) => {
  const id = parseInt(c.req.param('id'));

  if (isNaN(id)) {
    return c.json(
      {
        success: false,
        error: 'Invalid ID',
      },
      400
    );
  }

  try {
    const result = await db
      .select()
      .from(moods)
      .where(eq(moods.id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Mood not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: result[0],
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to fetch mood',
      },
      500
    );
  }
});

export default app;
