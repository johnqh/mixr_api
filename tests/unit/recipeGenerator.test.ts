import { describe, test, expect } from 'vitest';
import { extractJson, parseRecipeResponse, buildRecipePrompt } from '../../src/services/recipeParser';

describe('extractJson', () => {
  test('extracts raw JSON string', () => {
    const raw = '{"name": "Mojito"}';
    expect(extractJson(raw)).toBe('{"name": "Mojito"}');
  });

  test('extracts JSON from markdown code fence with json tag', () => {
    const raw = '```json\n{"name": "Mojito"}\n```';
    expect(extractJson(raw)).toBe('{"name": "Mojito"}');
  });

  test('extracts JSON from markdown code fence without tag', () => {
    const raw = '```\n{"name": "Mojito"}\n```';
    expect(extractJson(raw)).toBe('{"name": "Mojito"}');
  });

  test('extracts JSON object from surrounding text', () => {
    const raw = 'Here is the recipe:\n{"name": "Mojito"}\nEnjoy!';
    expect(extractJson(raw)).toBe('{"name": "Mojito"}');
  });

  test('handles multiline JSON in code fence', () => {
    const raw = '```json\n{\n  "name": "Mojito",\n  "description": "Classic"\n}\n```';
    const result = extractJson(raw);
    expect(JSON.parse(result)).toEqual({ name: 'Mojito', description: 'Classic' });
  });

  test('returns original string if no JSON found', () => {
    const raw = 'no json here';
    expect(extractJson(raw)).toBe('no json here');
  });
});

describe('parseRecipeResponse', () => {
  const validRecipeJson = JSON.stringify({
    name: 'Sunset Spritz',
    description: 'A refreshing citrus cocktail.',
    ingredients: [
      { name: 'Vodka', amount: '2 oz' },
      { name: 'Orange Juice', amount: '4 oz' },
    ],
    steps: ['Pour vodka over ice.', 'Top with orange juice.', 'Stir gently.'],
    equipmentUsed: ['Shaker', 'Jigger'],
  });

  test('parses a valid recipe JSON string', () => {
    const recipe = parseRecipeResponse(validRecipeJson);
    expect(recipe.name).toBe('Sunset Spritz');
    expect(recipe.description).toBe('A refreshing citrus cocktail.');
    expect(recipe.ingredients).toHaveLength(2);
    expect(recipe.steps).toHaveLength(3);
    expect(recipe.equipmentUsed).toHaveLength(2);
  });

  test('parses recipe from code-fenced response', () => {
    const fenced = '```json\n' + validRecipeJson + '\n```';
    const recipe = parseRecipeResponse(fenced);
    expect(recipe.name).toBe('Sunset Spritz');
  });

  test('defaults description to empty string if missing', () => {
    const json = JSON.stringify({
      name: 'Unnamed',
      ingredients: [{ name: 'Gin', amount: '1 oz' }],
      steps: ['Pour.'],
    });
    const recipe = parseRecipeResponse(json);
    expect(recipe.description).toBe('');
  });

  test('defaults equipmentUsed to empty array if missing', () => {
    const json = JSON.stringify({
      name: 'Unnamed',
      ingredients: [{ name: 'Gin', amount: '1 oz' }],
      steps: ['Pour.'],
    });
    const recipe = parseRecipeResponse(json);
    expect(recipe.equipmentUsed).toEqual([]);
  });

  test('throws on invalid JSON', () => {
    expect(() => parseRecipeResponse('not json at all')).toThrow('Failed to parse recipe JSON');
  });

  test('throws on missing name', () => {
    const json = JSON.stringify({
      ingredients: [{ name: 'Gin', amount: '1 oz' }],
      steps: ['Pour.'],
    });
    expect(() => parseRecipeResponse(json)).toThrow('missing or invalid "name"');
  });

  test('throws on missing ingredients', () => {
    const json = JSON.stringify({
      name: 'Test',
      steps: ['Pour.'],
    });
    expect(() => parseRecipeResponse(json)).toThrow('missing or empty "ingredients"');
  });

  test('throws on empty ingredients array', () => {
    const json = JSON.stringify({
      name: 'Test',
      ingredients: [],
      steps: ['Pour.'],
    });
    expect(() => parseRecipeResponse(json)).toThrow('missing or empty "ingredients"');
  });

  test('throws on missing steps', () => {
    const json = JSON.stringify({
      name: 'Test',
      ingredients: [{ name: 'Gin', amount: '1 oz' }],
    });
    expect(() => parseRecipeResponse(json)).toThrow('missing or empty "steps"');
  });

  test('throws on empty steps array', () => {
    const json = JSON.stringify({
      name: 'Test',
      ingredients: [{ name: 'Gin', amount: '1 oz' }],
      steps: [],
    });
    expect(() => parseRecipeResponse(json)).toThrow('missing or empty "steps"');
  });
});

describe('buildRecipePrompt', () => {
  test('includes all parameters in the prompt', () => {
    const prompt = buildRecipePrompt({
      equipmentNames: ['Shaker', 'Jigger'],
      ingredientNames: ['Vodka', 'Lime Juice'],
      moodName: 'Relaxed',
      moodDescription: 'Calm and soothing',
      moodExamples: 'Gin and Tonic, Mojito',
    });

    expect(prompt).toContain('Shaker, Jigger');
    expect(prompt).toContain('Vodka, Lime Juice');
    expect(prompt).toContain('MOOD: Relaxed');
    expect(prompt).toContain('Calm and soothing');
    expect(prompt).toContain('Gin and Tonic, Mojito');
    expect(prompt).toContain('equipmentUsed');
  });
});
