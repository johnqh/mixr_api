import { Hono } from 'hono';
import { eq, inArray, desc } from 'drizzle-orm';
import { db, equipment, ingredients, moods, recipes, recipeIngredients, recipeSteps, recipeEquipment } from '../db';
import { generateRecipe } from '../services/recipeGenerator';

const app = new Hono();

// Generate a new recipe
app.post('/generate', async (c) => {
  try {
    const body = await c.req.json();
    const { equipment_ids, ingredient_ids, mood_id } = body;

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

    // Save recipe to database
    const [savedRecipe] = await db
      .insert(recipes)
      .values({
        name: generatedRecipe.name,
        description: generatedRecipe.description,
        moodId: mood_id,
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

export default app;
