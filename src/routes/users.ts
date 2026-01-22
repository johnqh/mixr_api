import { Hono } from 'hono';
import { eq, desc, and } from 'drizzle-orm';
import { db, users, userPreferences, recipes, userFavorites, recipeIngredients, recipeSteps, recipeEquipment, equipment, ingredients, moods } from '../db';
import { requireAuth, type AuthUser } from '../middleware/auth';

type Variables = {
  user: AuthUser;
};

const app = new Hono<{ Variables: Variables }>();

// Apply auth middleware to all /me routes
app.use('/me/*', requireAuth);

// Helper function to get or create user
async function getOrCreateUser(authUser: AuthUser) {
  // Check if user exists
  let [user] = await db
    .select()
    .from(users)
    .where(eq(users.id, authUser.uid))
    .limit(1);

  // Create user if doesn't exist
  if (!user && authUser.email) {
    [user] = await db
      .insert(users)
      .values({
        id: authUser.uid,
        email: authUser.email,
        displayName: authUser.email.split('@')[0], // Default display name from email
      })
      .returning();
  }

  return user;
}

// Helper function to get complete recipe with all relations
async function getCompleteRecipe(recipeId: number) {
  const [recipe] = await db
    .select()
    .from(recipes)
    .where(eq(recipes.id, recipeId))
    .limit(1);

  if (!recipe) {
    return null;
  }

  // Get mood
  let mood = null;
  if (recipe.moodId) {
    const [moodData] = await db
      .select()
      .from(moods)
      .where(eq(moods.id, recipe.moodId))
      .limit(1);
    mood = moodData || null;
  }

  // Get ingredients
  const recipeIngredientsData = await db
    .select({
      id: recipeIngredients.id,
      amount: recipeIngredients.amount,
      ingredientId: ingredients.id,
      ingredientName: ingredients.name,
      ingredientIcon: ingredients.icon,
    })
    .from(recipeIngredients)
    .innerJoin(ingredients, eq(recipeIngredients.ingredientId, ingredients.id))
    .where(eq(recipeIngredients.recipeId, recipeId));

  // Get steps
  const steps = await db
    .select()
    .from(recipeSteps)
    .where(eq(recipeSteps.recipeId, recipeId))
    .orderBy(recipeSteps.stepNumber);

  // Get equipment
  const recipeEquipmentData = await db
    .select({
      id: recipeEquipment.id,
      equipmentId: equipment.id,
      equipmentName: equipment.name,
      equipmentIcon: equipment.icon,
    })
    .from(recipeEquipment)
    .innerJoin(equipment, eq(recipeEquipment.equipmentId, equipment.id))
    .where(eq(recipeEquipment.recipeId, recipeId));

  return {
    ...recipe,
    mood,
    ingredients: recipeIngredientsData.map((ri) => ({
      id: ri.ingredientId,
      name: ri.ingredientName,
      icon: ri.ingredientIcon,
      amount: ri.amount,
    })),
    steps: steps.map((s) => s.instruction),
    equipment: recipeEquipmentData.map((re) => ({
      id: re.equipmentId,
      name: re.equipmentName,
      icon: re.equipmentIcon,
    })),
  };
}

// GET /api/users/me - Get current user's profile
app.get('/me', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;
    const user = await getOrCreateUser(authUser);

    if (!user) {
      return c.json(
        {
          success: false,
          error: 'User not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        display_name: user.displayName,
        created_at: user.createdAt,
        updated_at: user.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get user error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch user',
      },
      500
    );
  }
});

// PUT /api/users/me - Update current user's profile
app.put('/me', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { display_name } = body;

    if (!display_name || typeof display_name !== 'string') {
      return c.json(
        {
          success: false,
          error: 'display_name is required and must be a string',
        },
        400
      );
    }

    // Ensure user exists
    await getOrCreateUser(authUser);

    // Update user
    const [updatedUser] = await db
      .update(users)
      .set({
        displayName: display_name,
        updatedAt: new Date(),
      })
      .where(eq(users.id, authUser.uid))
      .returning();

    return c.json({
      success: true,
      data: {
        id: updatedUser.id,
        email: updatedUser.email,
        display_name: updatedUser.displayName,
        created_at: updatedUser.createdAt,
        updated_at: updatedUser.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update user error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update user',
      },
      500
    );
  }
});

// GET /api/users/me/preferences - Get user preferences
app.get('/me/preferences', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;

    // Ensure user exists
    await getOrCreateUser(authUser);

    const [prefs] = await db
      .select()
      .from(userPreferences)
      .where(eq(userPreferences.userId, authUser.uid))
      .limit(1);

    if (!prefs) {
      // Return empty preferences if not set
      return c.json({
        success: true,
        data: {
          equipment_ids: [],
          ingredient_ids: [],
          updated_at: new Date().toISOString(),
        },
      });
    }

    return c.json({
      success: true,
      data: {
        equipment_ids: prefs.equipmentIds || [],
        ingredient_ids: prefs.ingredientIds || [],
        updated_at: prefs.updatedAt,
      },
    });
  } catch (error) {
    console.error('Get preferences error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch preferences',
      },
      500
    );
  }
});

// PUT /api/users/me/preferences - Update user preferences
app.put('/me/preferences', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { equipment_ids, ingredient_ids } = body;

    // Validate input
    if (!Array.isArray(equipment_ids) || !Array.isArray(ingredient_ids)) {
      return c.json(
        {
          success: false,
          error: 'equipment_ids and ingredient_ids must be arrays',
        },
        400
      );
    }

    // Ensure user exists
    await getOrCreateUser(authUser);

    // Upsert preferences
    const [prefs] = await db
      .insert(userPreferences)
      .values({
        userId: authUser.uid,
        equipmentIds: equipment_ids,
        ingredientIds: ingredient_ids,
        updatedAt: new Date(),
      })
      .onConflictDoUpdate({
        target: userPreferences.userId,
        set: {
          equipmentIds: equipment_ids,
          ingredientIds: ingredient_ids,
          updatedAt: new Date(),
        },
      })
      .returning();

    return c.json({
      success: true,
      data: {
        equipment_ids: prefs.equipmentIds || [],
        ingredient_ids: prefs.ingredientIds || [],
        updated_at: prefs.updatedAt,
      },
    });
  } catch (error) {
    console.error('Update preferences error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to update preferences',
      },
      500
    );
  }
});

// GET /api/users/me/recipes - Get recipes generated by current user
app.get('/me/recipes', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    // Ensure user exists
    await getOrCreateUser(authUser);

    const userRecipes = await db
      .select()
      .from(recipes)
      .where(eq(recipes.userId, authUser.uid))
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    const recipesWithDetails = await Promise.all(
      userRecipes.map((recipe) => getCompleteRecipe(recipe.id))
    );

    return c.json({
      success: true,
      data: recipesWithDetails,
      count: recipesWithDetails.length,
    });
  } catch (error) {
    console.error('Get user recipes error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch user recipes',
      },
      500
    );
  }
});

// GET /api/users/me/favorites - Get user's favorite recipes
app.get('/me/favorites', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    // Ensure user exists
    await getOrCreateUser(authUser);

    const favorites = await db
      .select({
        recipeId: userFavorites.recipeId,
        createdAt: userFavorites.createdAt,
      })
      .from(userFavorites)
      .where(eq(userFavorites.userId, authUser.uid))
      .orderBy(desc(userFavorites.createdAt))
      .limit(limit)
      .offset(offset);

    const recipesWithDetails = await Promise.all(
      favorites.map((fav) => getCompleteRecipe(fav.recipeId))
    );

    return c.json({
      success: true,
      data: recipesWithDetails.filter((r) => r !== null),
      count: recipesWithDetails.filter((r) => r !== null).length,
    });
  } catch (error) {
    console.error('Get favorites error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch favorites',
      },
      500
    );
  }
});

// POST /api/users/me/favorites - Add recipe to favorites
app.post('/me/favorites', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { recipe_id } = body;

    if (!recipe_id || typeof recipe_id !== 'number') {
      return c.json(
        {
          success: false,
          error: 'recipe_id is required and must be a number',
        },
        400
      );
    }

    // Ensure user exists
    await getOrCreateUser(authUser);

    // Check if recipe exists
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipe_id))
      .limit(1);

    if (!recipe) {
      return c.json(
        {
          success: false,
          error: 'Recipe not found',
        },
        404
      );
    }

    // Add to favorites (insert or ignore if already exists)
    await db
      .insert(userFavorites)
      .values({
        userId: authUser.uid,
        recipeId: recipe_id,
      })
      .onConflictDoNothing();

    return c.json({
      success: true,
      message: 'Recipe added to favorites',
    });
  } catch (error) {
    console.error('Add favorite error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to add favorite',
      },
      500
    );
  }
});

// DELETE /api/users/me/favorites/:recipeId - Remove recipe from favorites
app.delete('/me/favorites/:recipeId', async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;
    const recipeId = parseInt(c.req.param('recipeId'));

    if (isNaN(recipeId)) {
      return c.json(
        {
          success: false,
          error: 'Invalid recipe ID',
        },
        400
      );
    }

    // Ensure user exists
    await getOrCreateUser(authUser);

    // Delete favorite
    await db
      .delete(userFavorites)
      .where(
        and(
          eq(userFavorites.userId, authUser.uid),
          eq(userFavorites.recipeId, recipeId)
        )
      );

    return c.json({
      success: true,
      message: 'Recipe removed from favorites',
    });
  } catch (error) {
    console.error('Remove favorite error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to remove favorite',
      },
      500
    );
  }
});

export default app;
