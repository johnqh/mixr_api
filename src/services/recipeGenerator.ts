import OpenAI from 'openai';
import { env } from '../config/env';

const openai = new OpenAI({
  apiKey: env.OPENAI_API_KEY,
});

interface GenerateRecipeParams {
  equipmentNames: string[];
  ingredientNames: string[];
  moodName: string;
  moodDescription: string;
  moodExamples: string;
}

interface RecipeIngredient {
  name: string;
  amount: string;
}

interface GeneratedRecipe {
  name: string;
  description: string;
  ingredients: RecipeIngredient[];
  steps: string[];
  equipmentUsed: string[];
}

export async function generateRecipe(
  params: GenerateRecipeParams
): Promise<GeneratedRecipe> {
  const { equipmentNames, ingredientNames, moodName, moodDescription, moodExamples } = params;

  const prompt = `You are a professional mixologist. Create a unique cocktail recipe based on the following constraints:

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

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4-turbo-preview',
      messages: [
        {
          role: 'system',
          content:
            'You are a professional mixologist who creates creative cocktail recipes. Always respond with valid JSON only, no additional text.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.8,
    });

    const content = completion.choices[0].message.content;
    if (!content) {
      throw new Error('No response from OpenAI');
    }

    const recipe: GeneratedRecipe = JSON.parse(content);

    // Validate the response has required fields
    if (!recipe.name || !recipe.ingredients || !recipe.steps) {
      throw new Error('Invalid recipe format from OpenAI');
    }

    return recipe;
  } catch (error) {
    console.error('Error generating recipe:', error);
    throw new Error('Failed to generate recipe');
  }
}
