import { pgTable, serial, varchar, text, timestamp, integer, pgEnum } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Enums
export const equipmentSubcategoryEnum = pgEnum('equipment_subcategory', [
  'essential',
  'glassware',
  'garnish',
  'advanced',
]);

export const ingredientSubcategoryEnum = pgEnum('ingredient_subcategory', [
  'spirit',
  'wine',
  'other_alcohol',
  'fruit',
  'spice',
  'other',
]);

// Equipment Table
export const equipment = pgTable('equipment', {
  id: serial('id').primaryKey(),
  subcategory: equipmentSubcategoryEnum('subcategory').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Ingredients Table
export const ingredients = pgTable('ingredients', {
  id: serial('id').primaryKey(),
  subcategory: ingredientSubcategoryEnum('subcategory').notNull(),
  name: varchar('name', { length: 255 }).notNull(),
  icon: varchar('icon', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Moods Table
export const moods = pgTable('moods', {
  id: serial('id').primaryKey(),
  emoji: varchar('emoji', { length: 10 }).notNull(),
  name: varchar('name', { length: 100 }).notNull(),
  description: text('description').notNull(),
  exampleDrinks: text('example_drinks').notNull(),
  imageName: varchar('image_name', { length: 255 }),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Recipes Table
export const recipes = pgTable('recipes', {
  id: serial('id').primaryKey(),
  name: varchar('name', { length: 255 }).notNull(),
  description: text('description'),
  moodId: integer('mood_id').references(() => moods.id),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Recipe Ingredients Junction Table
export const recipeIngredients = pgTable('recipe_ingredients', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id).notNull(),
  ingredientId: integer('ingredient_id').references(() => ingredients.id).notNull(),
  amount: varchar('amount', { length: 100 }).notNull(),
});

// Recipe Steps Table
export const recipeSteps = pgTable('recipe_steps', {
  id: serial('id').primaryKey(),
  recipeId: integer('recipe_id').references(() => recipes.id).notNull(),
  stepNumber: integer('step_number').notNull(),
  instruction: text('instruction').notNull(),
});

// Recipe Equipment Junction Table
export const recipeEquipment = pgTable('recipe_equipment', {
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
  recipeIngredients: many(recipeIngredients),
  recipeSteps: many(recipeSteps),
  recipeEquipment: many(recipeEquipment),
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
