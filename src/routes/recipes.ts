import { Hono } from 'hono';
import { eq, inArray, desc, and, sql } from 'drizzle-orm';
import { db, equipment, ingredients, moods, recipes, recipeIngredients, recipeSteps, recipeEquipment, users, userPreferences, recipeRatings } from '../db';
import { generateRecipe } from '../services/recipeGenerator';
import { requireAuth, optionalAuth, AuthUser } from '../middleware/auth';

const app = new Hono();

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
        displayName: authUser.email.split('@')[0],
      })
      .returning();
  }

  return user;
}

// Generate a new recipe
app.post('/generate', requireAuth, async (c) => {
  try {
    const authUser = c.get('user') as AuthUser;
    const body = await c.req.json();
    let { equipment_ids, ingredient_ids, mood_id } = body;

    // Ensure user exists
    await getOrCreateUser(authUser);

    // If equipment_ids or ingredient_ids are empty, use user's saved preferences
    if ((!equipment_ids || equipment_ids.length === 0 || !ingredient_ids || ingredient_ids.length === 0)) {
      const [prefs] = await db
        .select()
        .from(userPreferences)
        .where(eq(userPreferences.userId, authUser.uid))
        .limit(1);

      if (prefs) {
        if (!equipment_ids || equipment_ids.length === 0) {
          equipment_ids = prefs.equipmentIds || [];
        }
        if (!ingredient_ids || ingredient_ids.length === 0) {
          ingredient_ids = prefs.ingredientIds || [];
        }
      }
    }

    // Validate input
    if (!equipment_ids || !Array.isArray(equipment_ids) || equipment_ids.length === 0) {
      return c.json(
        {
          success: false,
          error: 'equipment_ids must be a non-empty array',
        },
        400
      );
    }

    if (!ingredient_ids || !Array.isArray(ingredient_ids) || ingredient_ids.length === 0) {
      return c.json(
        {
          success: false,
          error: 'ingredient_ids must be a non-empty array',
        },
        400
      );
    }

    if (!mood_id || typeof mood_id !== 'number') {
      return c.json(
        {
          success: false,
          error: 'mood_id must be a number',
        },
        400
      );
    }

    // Fetch equipment data
    const equipmentData = await db
      .select()
      .from(equipment)
      .where(inArray(equipment.id, equipment_ids));

    if (equipmentData.length === 0) {
      return c.json(
        {
          success: false,
          error: 'No valid equipment found',
        },
        400
      );
    }

    // Fetch ingredient data
    const ingredientData = await db
      .select()
      .from(ingredients)
      .where(inArray(ingredients.id, ingredient_ids));

    if (ingredientData.length === 0) {
      return c.json(
        {
          success: false,
          error: 'No valid ingredients found',
        },
        400
      );
    }

    // Fetch mood data
    const moodData = await db
      .select()
      .from(moods)
      .where(eq(moods.id, mood_id))
      .limit(1);

    if (moodData.length === 0) {
      return c.json(
        {
          success: false,
          error: 'Mood not found',
        },
        404
      );
    }

    const mood = moodData[0];

    // Generate recipe using OpenAI
    const generatedRecipe = await generateRecipe({
      equipmentNames: equipmentData.map((e) => e.name),
      ingredientNames: ingredientData.map((i) => i.name),
      moodName: mood.name,
      moodDescription: mood.description,
      moodExamples: mood.exampleDrinks,
    });

    // Save recipe to database with user association
    const [savedRecipe] = await db
      .insert(recipes)
      .values({
        name: generatedRecipe.name,
        description: generatedRecipe.description,
        moodId: mood_id,
        userId: authUser.uid,
      })
      .returning();

    // Save recipe ingredients
    for (const recipeIngredient of generatedRecipe.ingredients) {
      // Find ingredient by name
      const matchedIngredient = ingredientData.find(
        (i) => i.name.toLowerCase() === recipeIngredient.name.toLowerCase()
      );

      if (matchedIngredient) {
        await db.insert(recipeIngredients).values({
          recipeId: savedRecipe.id,
          ingredientId: matchedIngredient.id,
          amount: recipeIngredient.amount,
        });
      }
    }

    // Save recipe steps
    for (let i = 0; i < generatedRecipe.steps.length; i++) {
      await db.insert(recipeSteps).values({
        recipeId: savedRecipe.id,
        stepNumber: i + 1,
        instruction: generatedRecipe.steps[i],
      });
    }

    // Save recipe equipment
    if (generatedRecipe.equipmentUsed) {
      for (const equipmentName of generatedRecipe.equipmentUsed) {
        const matchedEquipment = equipmentData.find(
          (e) => e.name.toLowerCase() === equipmentName.toLowerCase()
        );

        if (matchedEquipment) {
          await db.insert(recipeEquipment).values({
            recipeId: savedRecipe.id,
            equipmentId: matchedEquipment.id,
          });
        }
      }
    }

    // Fetch complete recipe with relations
    const completeRecipe = await getCompleteRecipe(savedRecipe.id);

    return c.json({
      success: true,
      data: completeRecipe,
    });
  } catch (error) {
    console.error('Recipe generation error:', error);
    return c.json(
      {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recipe',
      },
      500
    );
  }
});

// Get all recipes (with pagination)
app.get('/', async (c) => {
  try {
    const limit = parseInt(c.req.query('limit') || '10');
    const offset = parseInt(c.req.query('offset') || '0');

    const allRecipes = await db
      .select()
      .from(recipes)
      .orderBy(desc(recipes.createdAt))
      .limit(limit)
      .offset(offset);

    const recipesWithDetails = await Promise.all(
      allRecipes.map((recipe) => getCompleteRecipe(recipe.id))
    );

    return c.json({
      success: true,
      data: recipesWithDetails,
      count: recipesWithDetails.length,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to fetch recipes',
      },
      500
    );
  }
});

// Get recipe by ID
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
    const recipe = await getCompleteRecipe(id);

    if (!recipe) {
      return c.json(
        {
          success: false,
          error: 'Recipe not found',
        },
        404
      );
    }

    return c.json({
      success: true,
      data: recipe,
    });
  } catch (error) {
    return c.json(
      {
        success: false,
        error: 'Failed to fetch recipe',
      },
      500
    );
  }
});

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

// POST /api/recipes/:id/ratings - Submit or update a rating/review
app.post('/:id/ratings', requireAuth, async (c) => {
  const recipeId = parseInt(c.req.param('id'));

  if (isNaN(recipeId)) {
    return c.json(
      {
        success: false,
        error: 'Invalid recipe ID',
      },
      400
    );
  }

  try {
    const authUser = c.get('user') as AuthUser;
    const body = await c.req.json();
    const { stars, review } = body;

    // Validate stars
    if (!stars || typeof stars !== 'number' || stars < 1 || stars > 5) {
      return c.json(
        {
          success: false,
          error: 'stars must be a number between 1 and 5',
        },
        400
      );
    }

    // Validate review if provided
    if (review !== undefined && review !== null) {
      if (typeof review !== 'string') {
        return c.json(
          {
            success: false,
            error: 'review must be a string',
          },
          400
        );
      }
      if (review.length > 500) {
        return c.json(
          {
            success: false,
            error: 'review must be 500 characters or less',
          },
          400
        );
      }
    }

    // Ensure user exists
    const user = await getOrCreateUser(authUser);

    // Check if recipe exists
    const [recipe] = await db
      .select()
      .from(recipes)
      .where(eq(recipes.id, recipeId))
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

    // Upsert rating (insert or update if already exists)
    const [rating] = await db
      .insert(recipeRatings)
      .values({
        recipeId,
        userId: authUser.uid,
        stars,
        review: review || null,
      })
      .onConflictDoUpdate({
        target: [recipeRatings.userId, recipeRatings.recipeId],
        set: {
          stars,
          review: review || null,
          updatedAt: new Date(),
        },
      })
      .returning();

    return c.json({
      success: true,
      data: {
        id: rating.id,
        recipe_id: rating.recipeId,
        user_id: rating.userId,
        user_name: user?.displayName || 'Anonymous',
        user_email: user?.email || '',
        stars: rating.stars,
        review: rating.review,
        created_at: rating.createdAt,
        updated_at: rating.updatedAt,
      },
    });
  } catch (error) {
    console.error('Submit rating error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to submit rating',
      },
      500
    );
  }
});

// GET /api/recipes/:id/ratings - Get all ratings for a recipe
app.get('/:id/ratings', async (c) => {
  const recipeId = parseInt(c.req.param('id'));

  if (isNaN(recipeId)) {
    return c.json(
      {
        success: false,
        error: 'Invalid recipe ID',
      },
      400
    );
  }

  try {
    const limit = Math.min(parseInt(c.req.query('limit') || '20'), 100);
    const offset = parseInt(c.req.query('offset') || '0');
    const sort = c.req.query('sort') || 'newest';

    // Determine sort order
    let orderClause;
    switch (sort) {
      case 'oldest':
        orderClause = recipeRatings.createdAt;
        break;
      case 'highest':
        orderClause = desc(recipeRatings.stars);
        break;
      case 'lowest':
        orderClause = recipeRatings.stars;
        break;
      case 'newest':
      default:
        orderClause = desc(recipeRatings.createdAt);
    }

    const ratings = await db
      .select({
        id: recipeRatings.id,
        recipeId: recipeRatings.recipeId,
        userId: recipeRatings.userId,
        userName: users.displayName,
        userEmail: users.email,
        stars: recipeRatings.stars,
        review: recipeRatings.review,
        createdAt: recipeRatings.createdAt,
        updatedAt: recipeRatings.updatedAt,
      })
      .from(recipeRatings)
      .innerJoin(users, eq(recipeRatings.userId, users.id))
      .where(eq(recipeRatings.recipeId, recipeId))
      .orderBy(orderClause)
      .limit(limit)
      .offset(offset);

    // Get total count
    const [countResult] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(recipeRatings)
      .where(eq(recipeRatings.recipeId, recipeId));

    return c.json({
      success: true,
      data: ratings.map((r) => ({
        id: r.id,
        recipe_id: r.recipeId,
        user_id: r.userId,
        user_name: r.userName,
        user_email: r.userEmail,
        stars: r.stars,
        review: r.review,
        created_at: r.createdAt,
        updated_at: r.updatedAt,
      })),
      count: countResult.count,
    });
  } catch (error) {
    console.error('Get ratings error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch ratings',
      },
      500
    );
  }
});

// GET /api/recipes/:id/ratings/aggregate - Get aggregate rating statistics
app.get('/:id/ratings/aggregate', async (c) => {
  const recipeId = parseInt(c.req.param('id'));

  if (isNaN(recipeId)) {
    return c.json(
      {
        success: false,
        error: 'Invalid recipe ID',
      },
      400
    );
  }

  try {
    // Get aggregate stats
    const [stats] = await db
      .select({
        totalRatings: sql<number>`count(*)::int`,
        averageRating: sql<number>`round(avg(${recipeRatings.stars})::numeric, 1)::float`,
      })
      .from(recipeRatings)
      .where(eq(recipeRatings.recipeId, recipeId));

    // Get distribution
    const distribution = await db
      .select({
        stars: recipeRatings.stars,
        count: sql<number>`count(*)::int`,
      })
      .from(recipeRatings)
      .where(eq(recipeRatings.recipeId, recipeId))
      .groupBy(recipeRatings.stars);

    // Create distribution object
    const ratingDistribution: Record<string, number> = {
      '1': 0,
      '2': 0,
      '3': 0,
      '4': 0,
      '5': 0,
    };

    distribution.forEach((d) => {
      ratingDistribution[d.stars.toString()] = d.count;
    });

    return c.json({
      success: true,
      data: {
        recipe_id: recipeId,
        average_rating: stats.averageRating || 0,
        total_ratings: stats.totalRatings || 0,
        rating_distribution: ratingDistribution,
      },
    });
  } catch (error) {
    console.error('Get aggregate ratings error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to fetch aggregate ratings',
      },
      500
    );
  }
});

// DELETE /api/recipes/:recipeId/ratings/:ratingId - Delete a rating
app.delete('/:recipeId/ratings/:ratingId', requireAuth, async (c) => {
  const recipeId = parseInt(c.req.param('recipeId'));
  const ratingId = parseInt(c.req.param('ratingId'));

  if (isNaN(recipeId) || isNaN(ratingId)) {
    return c.json(
      {
        success: false,
        error: 'Invalid recipe ID or rating ID',
      },
      400
    );
  }

  try {
    const authUser = c.get('user') as AuthUser;

    // Check if rating exists and belongs to user
    const [rating] = await db
      .select()
      .from(recipeRatings)
      .where(
        and(
          eq(recipeRatings.id, ratingId),
          eq(recipeRatings.recipeId, recipeId),
          eq(recipeRatings.userId, authUser.uid)
        )
      )
      .limit(1);

    if (!rating) {
      return c.json(
        {
          success: false,
          error: 'Rating not found or you do not have permission to delete it',
        },
        404
      );
    }

    // Delete rating
    await db
      .delete(recipeRatings)
      .where(eq(recipeRatings.id, ratingId));

    return c.json({
      success: true,
      message: 'Rating deleted successfully',
    });
  } catch (error) {
    console.error('Delete rating error:', error);
    return c.json(
      {
        success: false,
        error: 'Failed to delete rating',
      },
      500
    );
  }
});

export default app;
