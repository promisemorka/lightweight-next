CREATE TABLE "exercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" text NOT NULL,
	"body_part" text NOT NULL,
	"equipment" text NOT NULL,
	"gif_url" text NOT NULL,
	"target" text NOT NULL,
	CONSTRAINT "exercises_name_unique" UNIQUE("name")
);
--> statement-breakpoint
CREATE TABLE "loggedexercises" (
	"id" serial PRIMARY KEY NOT NULL,
	"workout_id" integer NOT NULL,
	"exercise_id" integer NOT NULL,
	"weight" integer NOT NULL,
	"unit" text NOT NULL,
	"no_of_sets" integer NOT NULL,
	"no_of_reps" integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(25) NOT NULL,
	"first_name" text NOT NULL,
	"last_name" text NOT NULL,
	"email" text NOT NULL,
	"password_hash" text NOT NULL,
	"is_admin" boolean DEFAULT false NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
CREATE TABLE "workouts" (
	"id" serial PRIMARY KEY NOT NULL,
	"day_of_week" text NOT NULL,
	"description" text NOT NULL,
	"user_id" integer NOT NULL,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "loggedexercises" ADD CONSTRAINT "loggedexercises_workout_id_workouts_id_fk" FOREIGN KEY ("workout_id") REFERENCES "public"."workouts"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "loggedexercises" ADD CONSTRAINT "loggedexercises_exercise_id_exercises_id_fk" FOREIGN KEY ("exercise_id") REFERENCES "public"."exercises"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "workouts" ADD CONSTRAINT "workouts_user_id_users_id_fk" FOREIGN KEY ("user_id") REFERENCES "public"."users"("id") ON DELETE cascade ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "exercises_body_part_idx" ON "exercises" USING btree ("body_part");--> statement-breakpoint
CREATE INDEX "exercises_target_idx" ON "exercises" USING btree ("target");--> statement-breakpoint
CREATE INDEX "loggedexercises_workout_id_idx" ON "loggedexercises" USING btree ("workout_id");--> statement-breakpoint
CREATE INDEX "loggedexercises_exercise_id_idx" ON "loggedexercises" USING btree ("exercise_id");--> statement-breakpoint
CREATE UNIQUE INDEX "workouts_user_id_day_of_week_unique" ON "workouts" USING btree ("user_id","day_of_week");--> statement-breakpoint
CREATE INDEX "workouts_user_id_idx" ON "workouts" USING btree ("user_id");