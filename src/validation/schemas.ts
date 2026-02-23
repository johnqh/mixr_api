import { z } from 'zod';

// ============================================================
// Request body schemas for route handlers
// ============================================================

/** Schema for POST /api/recipes/generate request body */
export const generateRecipeSchema = z.object({
  equipment_ids: z
    .array(z.number().int().positive())
    .optional()
    .default([]),
  ingredient_ids: z
    .array(z.number().int().positive())
    .optional()
    .default([]),
  mood_id: z.number().int().positive({ message: 'mood_id must be a positive integer' }),
});

/** Schema for POST /api/recipes/:id/ratings request body */
export const submitRatingSchema = z.object({
  stars: z
    .number()
    .int()
    .min(1, 'stars must be between 1 and 5')
    .max(5, 'stars must be between 1 and 5'),
  review: z
    .string()
    .max(500, 'review must be 500 characters or less')
    .nullish(),
});

/** Schema for PUT /api/users/me request body */
export const updateUserSchema = z.object({
  display_name: z
    .string()
    .min(1, 'display_name must not be empty')
    .max(255, 'display_name must be 255 characters or less'),
});

/** Schema for PUT /api/users/me/preferences request body */
export const updatePreferencesSchema = z.object({
  equipment_ids: z.array(z.number().int().positive()),
  ingredient_ids: z.array(z.number().int().positive()),
});

/** Schema for POST /api/users/me/favorites request body */
export const addFavoriteSchema = z.object({
  recipe_id: z.number().int().positive({ message: 'recipe_id must be a positive integer' }),
});

/** Schema for pagination query parameters */
export const paginationSchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(10),
  offset: z.coerce.number().int().min(0).default(0),
});

/** Schema for ratings list query parameters */
export const ratingsQuerySchema = z.object({
  limit: z.coerce.number().int().min(1).max(100).default(20),
  offset: z.coerce.number().int().min(0).default(0),
  sort: z.enum(['newest', 'oldest', 'highest', 'lowest']).default('newest'),
});

// ============================================================
// Inferred types from schemas
// ============================================================

export type GenerateRecipeInput = z.infer<typeof generateRecipeSchema>;
export type SubmitRatingInput = z.infer<typeof submitRatingSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
export type UpdatePreferencesInput = z.infer<typeof updatePreferencesSchema>;
export type AddFavoriteInput = z.infer<typeof addFavoriteSchema>;
export type PaginationInput = z.infer<typeof paginationSchema>;
export type RatingsQueryInput = z.infer<typeof ratingsQuerySchema>;
