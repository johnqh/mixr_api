import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, ingredients } from '../db';

const app = new Hono();

// Get all ingredients or filter by subcategory
app.get('/', async (c) => {
  const subcategory = c.req.query('subcategory');

  try {
    let results;
    if (subcategory) {
      results = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.subcategory, subcategory as any));
    } else {
      results = await db.select().from(ingredients);
    }

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to fetch ingredients',
      },
      500
    );
  }
});

// Get ingredient subcategories
app.get('/subcategories', async (c) => {
  const subcategories = ['spirit', 'wine', 'other_alcohol', 'fruit', 'spice', 'other'];

  return c.json({
    success: true,
    data: subcategories,
  });
});

// Get ingredient by ID
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
      .from(ingredients)
      .where(eq(ingredients.id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Ingredient not found',
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
        error: 'Failed to fetch ingredient',
      },
      500
    );
  }
});

export default app;
