/** A single ingredient in a generated recipe */
export interface RecipeIngredient {
  name: string;
  amount: string;
}

/** The structured output from the AI recipe generator */
export interface GeneratedRecipe {
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  equipmentUsed: string[];
}

/** Parameters for AI recipe generation */
export interface GenerateRecipeParams {
  equipmentNames: string[];
  ingredientNames: string[];
  moodName: string;
  moodDescription: string;
  moodExamples: string;
}

/**
 * Extract JSON from a string that may contain markdown code fences or extra text.
 * Handles common LLM response patterns:
 * - Raw JSON
 * - ```json ... ``` blocks
 * - ``` ... ``` blocks
 * - JSON embedded in surrounding text
 */
export function extractJson(raw: string): string {
  // Try to extract from markdown code fences first
  const fenceMatch = raw.match(/```(?:json)?\s*\n?([\s\S]*?)\n?\s*```/);
  if (fenceMatch) {
    return fenceMatch[1].trim();
  }

  // Try to find a JSON object in the raw string
  const jsonMatch = raw.match(/\{[\s\S]*\}/);
  if (jsonMatch) {
    return jsonMatch[0].trim();
  }

  // Return as-is and let JSON.parse handle the error
  return raw.trim();
}

/**
 * Parse and validate the AI-generated recipe response.
 * Provides specific error messages for missing fields.
 */
export function parseRecipeResponse(content: string): GeneratedRecipe {
  const jsonStr = extractJson(content);

  let parsed: unknown;
  try {
    parsed = JSON.parse(jsonStr);
  } catch (parseError) {
    throw new Error(
      `Failed to parse recipe JSON: ${parseError instanceof Error ? parseError.message : 'unknown parse error'}`
    );
  }

  const recipe = parsed as Record<string, unknown>;

  if (!recipe.name || typeof recipe.name !== 'string') {
    throw new Error('Invalid recipe format: missing or invalid "name" field');
  }

  if (!Array.isArray(recipe.ingredients) || recipe.ingredients.length === 0) {
    throw new Error('Invalid recipe format: missing or empty "ingredients" array');
  }

  if (!Array.isArray(recipe.steps) || recipe.steps.length === 0) {
    throw new Error('Invalid recipe format: missing or empty "steps" array');
  }

  return {
    name: recipe.name,
    description: typeof recipe.description === 'string' ? recipe.description : '',
    ingredients: recipe.ingredients as RecipeIngredient[],
    steps: recipe.steps as string[],
    equipmentUsed: Array.isArray(recipe.equipmentUsed) ? recipe.equipmentUsed as string[] : [],
  };
}

/**
 * Build the prompt for the AI recipe generator.
 */
export function buildRecipePrompt(params: GenerateRecipeParams): string {
  const { equipmentNames, ingredientNames, moodName, moodDescription, moodExamples } = params;

  return `You are a professional mixologist. Create a unique cocktail recipe based on the following constraints:

AVAILABLE EQUIPMENT:
${equipmentNames.join(', ')}

AVAILABLE INGREDIENTS:
${ingredientNames.join(', ')}

MOOD: ${moodName}
Description: ${moodDescription}
Example drinks for inspiration: ${moodExamples}

INSTRUCTIONS:
1. Create a creative cocktail recipe that matches the mood
2. ONLY use ingredients from the available ingredients list
3. ONLY use equipment from the available equipment list
4. Provide specific measurements for each ingredient (e.g., "2 oz", "1/2 oz", "3 dashes", "1 whole")
5. Provide clear, numbered step-by-step instructions
6. Make the recipe realistic and achievable with the given equipment

Return your response in the following JSON format:
{
  "name": "Cocktail Name",
  "description": "Brief description of the cocktail (1-2 sentences)",
  "ingredients": [
    {
      "name": "Ingredient name (must match exactly from available ingredients)",
      "amount": "Measurement"
    }
  ],
  "steps": [
    "Step 1 instruction",
    "Step 2 instruction"
  ],
  "equipmentUsed": ["Equipment 1", "Equipment 2"]
}

Ensure the cocktail is creative, delicious, and perfectly matches the ${moodName} mood.`;
}
