"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { requireLoggedExerciseOwner, requireWorkoutOwner } from "@/lib/auth-guards";
import {
  loggedExerciseSchema,
  loggedExerciseUpdateSchema,
} from "@/lib/validations/logged-exercise";
import { loggedExercises } from "../../drizzle/schema";

export async function getLoggedExercise(loggedExerciseId: number) {
  await requireLoggedExerciseOwner(loggedExerciseId);
  return db.query.loggedExercises.findFirst({
    where: eq(loggedExercises.id, loggedExerciseId),
    with: { exercise: true },
  });
}

export type LoggedExerciseFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function createLoggedExercise(
  _prevState: LoggedExerciseFormState,
  formData: FormData
): Promise<LoggedExerciseFormState> {
  const parsed = loggedExerciseSchema.safeParse({
    workoutId: formData.get("workoutId"),
    exerciseId: formData.get("exerciseId"),
    weight: formData.get("weight"),
    unit: formData.get("unit"),
    noOfSets: formData.get("noOfSets"),
    noOfReps: formData.get("noOfReps"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await requireWorkoutOwner(parsed.data.workoutId);

  await db.insert(loggedExercises).values(parsed.data);

  revalidatePath(`/workouts/${parsed.data.workoutId}`);
  redirect(`/workouts/${parsed.data.workoutId}`);
}

export async function updateLoggedExercise(
  loggedExerciseId: number,
  _prevState: LoggedExerciseFormState,
  formData: FormData
): Promise<LoggedExerciseFormState> {
  const row = await requireLoggedExerciseOwner(loggedExerciseId);

  const parsed = loggedExerciseUpdateSchema.safeParse({
    weight: formData.get("weight"),
    unit: formData.get("unit"),
    noOfSets: formData.get("noOfSets"),
    noOfReps: formData.get("noOfReps"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await db
    .update(loggedExercises)
    .set(parsed.data)
    .where(eq(loggedExercises.id, loggedExerciseId));

  revalidatePath(`/workouts/${row.workoutId}`);
  redirect(`/workouts/${row.workoutId}`);
}

export async function deleteLoggedExercise(loggedExerciseId: number) {
  const row = await requireLoggedExerciseOwner(loggedExerciseId);
  await db.delete(loggedExercises).where(eq(loggedExercises.id, loggedExerciseId));
  revalidatePath(`/workouts/${row.workoutId}`);
}
