import { describe, test, expect } from 'vitest';
import {
  generateRecipeSchema,
  submitRatingSchema,
  updateUserSchema,
  updatePreferencesSchema,
  addFavoriteSchema,
  paginationSchema,
  ratingsQuerySchema,
} from '../../src/validation/schemas';

describe('generateRecipeSchema', () => {
  test('accepts valid input', () => {
    const result = generateRecipeSchema.safeParse({
      equipment_ids: [1, 2, 3],
      ingredient_ids: [4, 5],
      mood_id: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.equipment_ids).toEqual([1, 2, 3]);
      expect(result.data.ingredient_ids).toEqual([4, 5]);
      expect(result.data.mood_id).toBe(1);
    }
  });

  test('defaults equipment_ids and ingredient_ids to empty arrays', () => {
    const result = generateRecipeSchema.safeParse({
      mood_id: 1,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.equipment_ids).toEqual([]);
      expect(result.data.ingredient_ids).toEqual([]);
    }
  });

  test('rejects missing mood_id', () => {
    const result = generateRecipeSchema.safeParse({
      equipment_ids: [1],
      ingredient_ids: [2],
    });
    expect(result.success).toBe(false);
  });

  test('rejects non-integer mood_id', () => {
    const result = generateRecipeSchema.safeParse({
      equipment_ids: [1],
      ingredient_ids: [2],
      mood_id: 1.5,
    });
    expect(result.success).toBe(false);
  });

  test('rejects negative equipment_ids', () => {
    const result = generateRecipeSchema.safeParse({
      equipment_ids: [-1],
      ingredient_ids: [2],
      mood_id: 1,
    });
    expect(result.success).toBe(false);
  });

  test('rejects string in ingredient_ids', () => {
    const result = generateRecipeSchema.safeParse({
      equipment_ids: [1],
      ingredient_ids: ['abc'],
      mood_id: 1,
    });
    expect(result.success).toBe(false);
  });
});

describe('submitRatingSchema', () => {
  test('accepts valid rating with review', () => {
    const result = submitRatingSchema.safeParse({
      stars: 4,
      review: 'Great cocktail!',
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.stars).toBe(4);
      expect(result.data.review).toBe('Great cocktail!');
    }
  });

  test('accepts rating without review', () => {
    const result = submitRatingSchema.safeParse({ stars: 3 });
    expect(result.success).toBe(true);
  });

  test('accepts rating with null review', () => {
    const result = submitRatingSchema.safeParse({ stars: 5, review: null });
    expect(result.success).toBe(true);
  });

  test('rejects stars below 1', () => {
    const result = submitRatingSchema.safeParse({ stars: 0 });
    expect(result.success).toBe(false);
  });

  test('rejects stars above 5', () => {
    const result = submitRatingSchema.safeParse({ stars: 6 });
    expect(result.success).toBe(false);
  });

  test('rejects non-integer stars', () => {
    const result = submitRatingSchema.safeParse({ stars: 3.5 });
    expect(result.success).toBe(false);
  });

  test('rejects review longer than 500 characters', () => {
    const result = submitRatingSchema.safeParse({
      stars: 3,
      review: 'x'.repeat(501),
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing stars', () => {
    const result = submitRatingSchema.safeParse({ review: 'no stars' });
    expect(result.success).toBe(false);
  });
});

describe('updateUserSchema', () => {
  test('accepts valid display name', () => {
    const result = updateUserSchema.safeParse({ display_name: 'John' });
    expect(result.success).toBe(true);
  });

  test('rejects empty display_name', () => {
    const result = updateUserSchema.safeParse({ display_name: '' });
    expect(result.success).toBe(false);
  });

  test('rejects missing display_name', () => {
    const result = updateUserSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('rejects display_name over 255 characters', () => {
    const result = updateUserSchema.safeParse({ display_name: 'x'.repeat(256) });
    expect(result.success).toBe(false);
  });
});

describe('updatePreferencesSchema', () => {
  test('accepts valid preference arrays', () => {
    const result = updatePreferencesSchema.safeParse({
      equipment_ids: [1, 2],
      ingredient_ids: [3, 4],
    });
    expect(result.success).toBe(true);
  });

  test('accepts empty arrays', () => {
    const result = updatePreferencesSchema.safeParse({
      equipment_ids: [],
      ingredient_ids: [],
    });
    expect(result.success).toBe(true);
  });

  test('rejects non-array equipment_ids', () => {
    const result = updatePreferencesSchema.safeParse({
      equipment_ids: 'not array',
      ingredient_ids: [1],
    });
    expect(result.success).toBe(false);
  });

  test('rejects missing ingredient_ids', () => {
    const result = updatePreferencesSchema.safeParse({
      equipment_ids: [1],
    });
    expect(result.success).toBe(false);
  });
});

describe('addFavoriteSchema', () => {
  test('accepts valid recipe_id', () => {
    const result = addFavoriteSchema.safeParse({ recipe_id: 42 });
    expect(result.success).toBe(true);
  });

  test('rejects missing recipe_id', () => {
    const result = addFavoriteSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  test('rejects non-number recipe_id', () => {
    const result = addFavoriteSchema.safeParse({ recipe_id: 'abc' });
    expect(result.success).toBe(false);
  });

  test('rejects zero recipe_id', () => {
    const result = addFavoriteSchema.safeParse({ recipe_id: 0 });
    expect(result.success).toBe(false);
  });
});

describe('paginationSchema', () => {
  test('uses default values', () => {
    const result = paginationSchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(10);
      expect(result.data.offset).toBe(0);
    }
  });

  test('coerces string values', () => {
    const result = paginationSchema.safeParse({ limit: '25', offset: '10' });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(25);
      expect(result.data.offset).toBe(10);
    }
  });

  test('clamps limit to max 100', () => {
    const result = paginationSchema.safeParse({ limit: '200' });
    expect(result.success).toBe(false);
  });

  test('rejects negative offset', () => {
    const result = paginationSchema.safeParse({ offset: '-1' });
    expect(result.success).toBe(false);
  });
});

describe('ratingsQuerySchema', () => {
  test('uses default values', () => {
    const result = ratingsQuerySchema.safeParse({});
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.limit).toBe(20);
      expect(result.data.offset).toBe(0);
      expect(result.data.sort).toBe('newest');
    }
  });

  test('accepts valid sort values', () => {
    for (const sort of ['newest', 'oldest', 'highest', 'lowest']) {
      const result = ratingsQuerySchema.safeParse({ sort });
      expect(result.success).toBe(true);
    }
  });

  test('rejects invalid sort value', () => {
    const result = ratingsQuerySchema.safeParse({ sort: 'random' });
    expect(result.success).toBe(false);
  });
});
