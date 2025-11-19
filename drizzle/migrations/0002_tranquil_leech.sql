ALTER TABLE "mixr"."user_favorites" ADD CONSTRAINT "user_favorites_user_id_recipe_id_pk" PRIMARY KEY("user_id","recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_ratings_recipe_id_idx" ON "mixr"."recipe_ratings" USING btree ("recipe_id");--> statement-breakpoint
CREATE INDEX "recipe_ratings_user_id_idx" ON "mixr"."recipe_ratings" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_favorites_user_id_idx" ON "mixr"."user_favorites" USING btree ("user_id");--> statement-breakpoint
CREATE INDEX "user_favorites_recipe_id_idx" ON "mixr"."user_favorites" USING btree ("recipe_id");--> statement-breakpoint
ALTER TABLE "mixr"."recipe_ratings" ADD CONSTRAINT "unique_user_recipe" UNIQUE("user_id","recipe_id");