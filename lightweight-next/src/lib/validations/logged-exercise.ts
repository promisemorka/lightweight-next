import { z } from "zod";

export const loggedExerciseSchema = z.object({
  workoutId: z.coerce.number().int().positive(),
  exerciseId: z.coerce.number().int().positive(),
  weight: z.coerce.number().int().nonnegative(),
  unit: z.enum(["lbs", "kg"]),
  noOfSets: z.coerce.number().int().positive(),
  noOfReps: z.coerce.number().int().positive(),
});

export const loggedExerciseUpdateSchema = loggedExerciseSchema.omit({
  workoutId: true,
  exerciseId: true,
});

export type LoggedExerciseInput = z.infer<typeof loggedExerciseSchema>;
export type LoggedExerciseUpdateInput = z.infer<
  typeof loggedExerciseUpdateSchema
>;
