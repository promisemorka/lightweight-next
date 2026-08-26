import { z } from "zod";

export const exerciseSchema = z.object({
  name: z.string().min(1, "Name is required"),
  bodyPart: z.string().min(1, "Body part is required"),
  equipment: z.string().min(1, "Equipment is required"),
  gifUrl: z.url("Must be a valid URL"),
  target: z.string().min(1, "Target is required"),
});

export const exerciseSearchSchema = z.object({
  name: z.string().optional(),
  bodyPart: z.string().optional(),
  equipment: z.string().optional(),
  target: z.string().optional(),
});

export type ExerciseInput = z.infer<typeof exerciseSchema>;
export type ExerciseSearchInput = z.infer<typeof exerciseSearchSchema>;
