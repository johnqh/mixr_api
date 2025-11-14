CREATE SCHEMA "mixr";
--> statement-breakpoint
CREATE TYPE "mixr"."equipment_subcategory" AS ENUM('essential', 'glassware', 'garnish', 'advanced');--> statement-breakpoint
CREATE TYPE "mixr"."ingredient_subcategory" AS ENUM('spirit', 'wine', 'other_alcohol', 'fruit', 'spice', 'other');--> statement-breakpoint
CREATE TABLE "mixr"."equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"subcategory" "mixr"."equipment_subcategory" NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"subcategory" "mixr"."ingredient_subcategory" NOT NULL,
	"name" varchar(255) NOT NULL,
	"icon" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."moods" (
	"id" serial PRIMARY KEY NOT NULL,
	"emoji" varchar(10) NOT NULL,
	"name" varchar(100) NOT NULL,
	"description" text NOT NULL,
	"example_drinks" text NOT NULL,
	"image_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."recipe_equipment" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"equipment_id" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."recipe_ingredients" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"ingredient_id" integer NOT NULL,
	"amount" varchar(100) NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."recipe_steps" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"step_number" integer NOT NULL,
	"instruction" text NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."recipes" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(255) NOT NULL,
	"description" text,
	"mood_id" integer,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "mixr"."recipe_equipment" ADD CONSTRAINT "recipe_equipment_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "mixr"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."recipe_equipment" ADD CONSTRAINT "recipe_equipment_equipment_id_equipment_id_fk" FOREIGN KEY ("equipment_id") REFERENCES "mixr"."equipment"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "mixr"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."recipe_ingredients" ADD CONSTRAINT "recipe_ingredients_ingredient_id_ingredients_id_fk" FOREIGN KEY ("ingredient_id") REFERENCES "mixr"."ingredients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."recipe_steps" ADD CONSTRAINT "recipe_steps_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "mixr"."recipes"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."recipes" ADD CONSTRAINT "recipes_mood_id_moods_id_fk" FOREIGN KEY ("mood_id") REFERENCES "mixr"."moods"("id") ON DELETE no action ON UPDATE no action;