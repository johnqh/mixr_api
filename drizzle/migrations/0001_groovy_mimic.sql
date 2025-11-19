CREATE TABLE "mixr"."recipe_ratings" (
	"id" serial PRIMARY KEY NOT NULL,
	"recipe_id" integer NOT NULL,
	"user_id" varchar(128) NOT NULL,
	"stars" integer NOT NULL,
	"review" text,
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."user_favorites" (
	"user_id" varchar(128) NOT NULL,
	"recipe_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."user_preferences" (
	"user_id" varchar(128) PRIMARY KEY NOT NULL,
	"equipment_ids" integer[],
	"ingredient_ids" integer[],
	"updated_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mixr"."users" (
	"id" varchar(128) PRIMARY KEY NOT NULL,
	"email" varchar(255) NOT NULL,
	"display_name" varchar(255),
	"created_at" timestamp DEFAULT now() NOT NULL,
	"updated_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_email_unique" UNIQUE("email")
);
--> statement-breakpoint
ALTER TABLE "mixr"."recipes" ADD COLUMN "user_id" varchar(128);--> statement-breakpoint
ALTER TABLE "mixr"."recipe_ratings" ADD CONSTRAINT "recipe_ratings_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "mixr"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."recipe_ratings" ADD CONSTRAINT "recipe_ratings_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mixr"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."user_favorites" ADD CONSTRAINT "user_favorites_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mixr"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."user_favorites" ADD CONSTRAINT "user_favorites_recipe_id_recipes_id_fk" FOREIGN KEY ("recipe_id") REFERENCES "mixr"."recipes"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."user_preferences" ADD CONSTRAINT "user_preferences_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mixr"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "mixr"."recipes" ADD CONSTRAINT "recipes_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "mixr"."users"("id") ON DELETE set null ON UPDATE no action;
