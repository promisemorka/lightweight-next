import { relations } from "drizzle-orm";
import {
  boolean,
  index,
  integer,
  pgTable,
  serial,
  text,
  timestamp,
  uniqueIndex,
  varchar,
} from "drizzle-orm/pg-core";

export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 25 }).notNull().unique(),
  firstName: text("first_name").notNull(),
  lastName: text("last_name").notNull(),
  email: text("email").notNull(),
  passwordHash: text("password_hash").notNull(),
  isAdmin: boolean("is_admin").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const workouts = pgTable(
  "workouts",
  {
    id: serial("id").primaryKey(),
    dayOfWeek: text("day_of_week").notNull(),
    description: text("description").notNull(),
    userId: integer("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    uniqueIndex("workouts_user_id_day_of_week_unique").on(
      t.userId,
      t.dayOfWeek
    ),
    index("workouts_user_id_idx").on(t.userId),
  ]
);

export const exercises = pgTable(
  "exercises",
  {
    id: serial("id").primaryKey(),
    name: text("name").notNull().unique(),
    bodyPart: text("body_part").notNull(),
    equipment: text("equipment").notNull(),
    gifUrl: text("gif_url").notNull(),
    target: text("target").notNull(),
  },
  (t) => [
    index("exercises_body_part_idx").on(t.bodyPart),
    index("exercises_target_idx").on(t.target),
  ]
);

export const loggedExercises = pgTable(
  "loggedexercises",
  {
    id: serial("id").primaryKey(),
    workoutId: integer("workout_id")
      .notNull()
      .references(() => workouts.id, { onDelete: "cascade" }),
    exerciseId: integer("exercise_id")
      .notNull()
      .references(() => exercises.id, { onDelete: "cascade" }),
    weight: integer("weight").notNull(),
    unit: text("unit", { enum: ["lbs", "kg"] }).notNull(),
    noOfSets: integer("no_of_sets").notNull(),
    noOfReps: integer("no_of_reps").notNull(),
    performedAt: timestamp("performed_at").notNull().defaultNow(),
  },
  (t) => [
    index("loggedexercises_workout_id_idx").on(t.workoutId),
    index("loggedexercises_exercise_id_idx").on(t.exerciseId),
  ]
);

export const usersRelations = relations(users, ({ many }) => ({
  workouts: many(workouts),
}));

export const workoutsRelations = relations(workouts, ({ one, many }) => ({
  user: one(users, {
    fields: [workouts.userId],
    references: [users.id],
  }),
  loggedExercises: many(loggedExercises),
}));

export const exercisesRelations = relations(exercises, ({ many }) => ({
  loggedExercises: many(loggedExercises),
}));

export const loggedExercisesRelations = relations(
  loggedExercises,
  ({ one }) => ({
    workout: one(workouts, {
      fields: [loggedExercises.workoutId],
      references: [workouts.id],
    }),
    exercise: one(exercises, {
      fields: [loggedExercises.exerciseId],
      references: [exercises.id],
    }),
  })
);
