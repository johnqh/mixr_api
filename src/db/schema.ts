import { serial, varchar, text, timestamp, integer, pgSchema, unique, primaryKey, index } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Define the mixr schema
export const mixrSchema = pgSchema('mixr');

// Enums
export const equipmentSubcategoryEnum = mixrSchema.enum('equipment_subcategory', [
  'essential',
  'glassware',
  'garnish',
  'advanced',
]);

export const ingredientSubcategoryEnum = mixrSchema.enum('ingredient_subcategory', [
  'spirit',
  'wine',
  'other_alcohol',
  'fruit',
  'spice',
  'other',
]);

// Equipment Table
export const equipment = mixrSchema.table('equipment', {
  id: serial('id').primaryKey(),
  subcategory: equipmentSubcategoryEnum('subcategory').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ingredients Table
export const ingredients = mixrSchema.table('ingredients', {
  id: serial('id').primaryKey(),
  subcategory: ingredientSubcategoryEnum('subcategory').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Moods Table
export const moods = mixrSchema.table('moods', {
  id: serial('id').primaryKey(),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  exampleDrinks: text('example_drinks').notNull(),
  imageName: varchar('image_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Users Table
export const users = mixrSchema.table('users', {
  id: varchar('id', { length: 128 }).primaryKey(), // Firebase UID
  email: varchar('email', { length: 255 }).notNull().unique(),
  displayName: varchar('display_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Preferences Table
export const userPreferences = mixrSchema.table('user_preferences', {
  userId: varchar('user_id', { length: 128 }).primaryKey().references(() => users.id, { onDelete: 'cascade' }),
  equipmentIds: integer('equipment_ids').array(),
  ingredientIds: integer('ingredient_ids').array(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Recipes Table
export const recipes = mixrSchema.table('recipes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  moodId: integer('mood_id').references(() => moods.id),
  userId: varchar('user_id', { length: 128 }).references(() => users.id, { onDelete: 'set null' }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Recipe Ratings Table
export const recipeRatings = mixrSchema.table('recipe_ratings', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  userId: varchar('user_id', { length: 128 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  stars: integer('stars').notNull(),
  review: text('review'),
  createdAt: timestamp('created_at').defaultNow().notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
}, (table) => ({
  uniqueUserRecipe: unique('unique_user_recipe').on(table.userId, table.recipeId),
  recipeIdIdx: index('recipe_ratings_recipe_id_idx').on(table.recipeId),
  userIdIdx: index('recipe_ratings_user_id_idx').on(table.userId),
}));

// User Favorites Table
export const userFavorites = mixrSchema.table('user_favorites', {
  userId: varchar('user_id', { length: 128 }).references(() => users.id, { onDelete: 'cascade' }).notNull(),
  recipeId: integer('recipe_id').references(() => recipes.id, { onDelete: 'cascade' }).notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
}, (table) => ({
  pk: primaryKey({ columns: [table.userId, table.recipeId] }),
  userIdIdx: index('user_favorites_user_id_idx').on(table.userId),
  recipeIdIdx: index('user_favorites_recipe_id_idx').on(table.recipeId),
}));

// Recipe Ingredients Junction Table
export const recipeIngredients = mixrSchema.table('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id).notNull(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id).notNull(),
  amount: varchar('amount', { length: 100 }).notNull(),
});

// Recipe Steps Table
export const recipeSteps = mixrSchema.table('recipe_steps', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id).notNull(),
  stepNumber: integer('step_number').notNull(),
  instruction: text('instruction').notNull(),
});

// Recipe Equipment Junction Table
export const recipeEquipment = mixrSchema.table('recipe_equipment', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id).notNull(),
  equipmentId: integer('equipment_id').references(() => equipment.id).notNull(),
});

// Relations
export const recipesRelations = relations(recipes, ({ one, many }) => ({
  mood: one(moods, {
    fields: [recipes.moodId],
    references: [moods.id],
  }),
  user: one(users, {
    fields: [recipes.userId],
    references: [users.id],
  }),
  recipeIngredients: many(recipeIngredients),
  recipeSteps: many(recipeSteps),
  recipeEquipment: many(recipeEquipment),
  ratings: many(recipeRatings),
  favorites: many(userFavorites),
}));

export const recipeIngredientsRelations = relations(recipeIngredients, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeIngredients.recipeId],
    references: [recipes.id],
  }),
  ingredient: one(ingredients, {
    fields: [recipeIngredients.ingredientId],
    references: [ingredients.id],
  }),
}));

export const recipeStepsRelations = relations(recipeSteps, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeSteps.recipeId],
    references: [recipes.id],
  }),
}));

export const recipeEquipmentRelations = relations(recipeEquipment, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeEquipment.recipeId],
    references: [recipes.id],
  }),
  equipment: one(equipment, {
    fields: [recipeEquipment.equipmentId],
    references: [equipment.id],
  }),
}));

export const moodsRelations = relations(moods, ({ many }) => ({
  recipes: many(recipes),
}));

export const usersRelations = relations(users, ({ one, many }) => ({
  preferences: one(userPreferences, {
    fields: [users.id],
    references: [userPreferences.userId],
  }),
  recipes: many(recipes),
  ratings: many(recipeRatings),
  favorites: many(userFavorites),
}));

export const userPreferencesRelations = relations(userPreferences, ({ one }) => ({
  user: one(users, {
    fields: [userPreferences.userId],
    references: [users.id],
  }),
}));

export const recipeRatingsRelations = relations(recipeRatings, ({ one }) => ({
  recipe: one(recipes, {
    fields: [recipeRatings.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [recipeRatings.userId],
    references: [users.id],
  }),
}));

export const userFavoritesRelations = relations(userFavorites, ({ one }) => ({
  recipe: one(recipes, {
    fields: [userFavorites.recipeId],
    references: [recipes.id],
  }),
  user: one(users, {
    fields: [userFavorites.userId],
    references: [users.id],
  }),
}));
