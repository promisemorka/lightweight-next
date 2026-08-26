"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { db } from "@/db";
import { requireAdmin, requireUser, requireWorkoutOwner } from "@/lib/auth-guards";
import { workoutSchema } from "@/lib/validations/workout";
import { workouts } from "../../drizzle/schema";

export async function getWorkoutsForCurrentUser() {
  const user = await requireUser();
  return db.query.workouts.findMany({
    where: eq(workouts.userId, Number(user.id)),
    with: { loggedExercises: { with: { exercise: true } } },
    orderBy: (w, { asc }) => [asc(w.createdAt)],
  });
}

export async function getWorkout(workoutId: number) {
  const workout = await requireWorkoutOwner(workoutId);
  return db.query.workouts.findFirst({
    where: eq(workouts.id, workout.id),
    with: { loggedExercises: { with: { exercise: true } } },
  });
}

export async function adminGetWorkoutsForUser(userId: number) {
  await requireAdmin();
  return db.query.workouts.findMany({ where: eq(workouts.userId, userId) });
}

export type WorkoutFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function createWorkout(
  _prevState: WorkoutFormState,
  formData: FormData
): Promise<WorkoutFormState> {
  const user = await requireUser();

  const parsed = workoutSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const existing = await db.query.workouts.findFirst({
    where: (w, { and, eq, ilike }) =>
      and(eq(w.userId, Number(user.id)), ilike(w.dayOfWeek, parsed.data.dayOfWeek)),
  });
  if (existing) {
    return { errors: { dayOfWeek: ["You already have a workout for this day"] } };
  }

  const [workout] = await db
    .insert(workouts)
    .values({ ...parsed.data, userId: Number(user.id) })
    .returning({ id: workouts.id });

  revalidatePath("/workouts");
  redirect(`/workouts/${workout.id}`);
}

export async function updateWorkout(
  workoutId: number,
  _prevState: WorkoutFormState,
  formData: FormData
): Promise<WorkoutFormState> {
  await requireWorkoutOwner(workoutId);

  const parsed = workoutSchema.safeParse({
    dayOfWeek: formData.get("dayOfWeek"),
    description: formData.get("description"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await db.update(workouts).set(parsed.data).where(eq(workouts.id, workoutId));
  revalidatePath("/workouts");
  revalidatePath(`/workouts/${workoutId}`);
  redirect(`/workouts/${workoutId}`);
}

export async function deleteWorkout(workoutId: number) {
  await requireWorkoutOwner(workoutId);
  await db.delete(workouts).where(eq(workouts.id, workoutId));
  revalidatePath("/workouts");
  redirect("/workouts");
}
