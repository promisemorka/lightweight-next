import { z } from "zod";

export const DAYS_OF_WEEK = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
] as const;

export const workoutSchema = z.object({
  dayOfWeek: z.enum(DAYS_OF_WEEK, { error: "Choose a day of the week" }),
  description: z.string().min(1, "Description is required"),
});

export type WorkoutInput = z.infer<typeof workoutSchema>;
