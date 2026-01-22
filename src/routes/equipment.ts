import { Hono } from 'hono';
import { eq } from 'drizzle-orm';
import { db, equipment } from '../db';
import { EQUIPMENT_SUBCATEGORIES, type EquipmentSubcategory } from '@sudobility/mixr_types';

const app = new Hono();

// Get all equipment or filter by subcategory
app.get('/', async (c) => {
  const subcategory = c.req.query('subcategory') as EquipmentSubcategory | undefined;

  try {
    let results;
    if (subcategory) {
      results = await db
        .select()
        .from(equipment)
        .where(eq(equipment.subcategory, subcategory));
    } else {
      results = await db.select().from(equipment);
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
        error: 'Failed to fetch equipment',
      },
      500
    );
  }
});

// Get equipment subcategories
app.get('/subcategories', async (c) => {
  return c.json({
    success: true,
    data: EQUIPMENT_SUBCATEGORIES,
  });
});

// Get equipment by ID
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
      .from(equipment)
      .where(eq(equipment.id, id))
      .limit(1);

    if (result.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Equipment not found',
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
        error: 'Failed to fetch equipment',
      },
      500
    );
  }
});

export default app;
