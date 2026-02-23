import OpenAI from 'openai';
import { env } from '../config/env';
import { buildRecipePrompt, parseRecipeResponse } from './recipeParser';

// Re-export types and pure functions for convenience
export type { GenerateRecipeParams, RecipeIngredient, GeneratedRecipe } from './recipeParser';
export { extractJson, parseRecipeResponse, buildRecipePrompt } from './recipeParser';

// Configure OpenAI client based on whether LLM Studio endpoint is set
const openai = new OpenAI({
  apiKey: env.LLM_STUDIO_ENDPOINT
    ? 'lm-studio' // LLM Studio doesn't require a real API key
    : env.OPENAI_API_KEY, // Use OpenAI API key if no LLM Studio endpoint
  baseURL: env.LLM_STUDIO_ENDPOINT || undefined, // Use LLM Studio endpoint if set, otherwise use default OpenAI endpoint
});

/**
 * Generate a cocktail recipe using the AI service (OpenAI or LM Studio).
 *
 * @param params - Equipment, ingredients, and mood to generate a recipe for
 * @returns The generated recipe with name, description, ingredients, steps, and equipment
 * @throws Error with descriptive message if generation or parsing fails
 */
export async function generateRecipe(
  params: Parameters<typeof buildRecipePrompt>[0]
): Promise<ReturnType<typeof parseRecipeResponse>> {
  const prompt = buildRecipePrompt(params);

  // Use different model based on whether LLM Studio endpoint is configured
  const model = env.LLM_STUDIO_ENDPOINT
    ? 'qwen-32b-everything' // LLM Studio model
    : 'gpt-4'; // OpenAI model

  let completion: OpenAI.Chat.Completions.ChatCompletion;
  try {
    completion = await openai.chat.completions.create({
      model,
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
      // Note: LM Studio doesn't support 'json_object' response format
      // Relying on system message to enforce JSON output
      temperature: 0.8,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown API error';
    console.error('AI API call failed:', message);
    throw new Error(`AI service error: ${message}`);
  }

  const content = completion.choices[0].message.content;
  if (!content) {
    throw new Error('AI service returned empty response');
  }

  return parseRecipeResponse(content);
}
