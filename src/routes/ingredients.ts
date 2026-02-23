import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, ingredients } from '../db';
import { INGREDIENT_SUBCATEGORIES, type IngredientSubcategory } from '@sudobility/mixr_types';

const app = new Hono();

/**
 * GET /api/ingredients
 * List all ingredients, optionally filtered by subcategory query parameter.
 */
app.get('/', async (c) => {
  const subcategory = c.req.query('subcategory') as IngredientSubcategory | undefined;

  try {
    let results;
    if (subcategory) {
      results = await db
        .select()
        .from(ingredients)
        .where(eq(ingredients.subcategory, subcategory));
    } else {
      results = await db.select().from(ingredients);
    }

    return c.json({
      success: true,
      data: results,
      count: results.length,
    });
  } catch (_error) {
    return c.json(
      {
        success: false,
        error: 'Failed to fetch ingredients',
      },
      500
    );
  }
});

/**
 * GET /api/ingredients/subcategories
 * List all valid ingredient subcategory values.
 */
app.get('/subcategories', async (c) => {
  return c.json({
    success: true,
    data: INGREDIENT_SUBCATEGORIES,
  });
});

/**
 * GET /api/ingredients/:id
 * Get a single ingredient by ID.
 */
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
  } catch (_error) {
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
