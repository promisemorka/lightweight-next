"use server";

import { and, asc, eq, ilike } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { requireAdmin } from "@/lib/auth-guards";
import { exerciseSchema, type ExerciseSearchInput } from "@/lib/validations/exercise";
import { exercises } from "../../drizzle/schema";

export async function searchExercises(filters: ExerciseSearchInput) {
  const conditions = [];
  if (filters.name) conditions.push(ilike(exercises.name, `%${filters.name}%`));
  if (filters.bodyPart) conditions.push(ilike(exercises.bodyPart, `%${filters.bodyPart}%`));
  if (filters.equipment) conditions.push(ilike(exercises.equipment, `%${filters.equipment}%`));
  if (filters.target) conditions.push(ilike(exercises.target, `%${filters.target}%`));

  return db.query.exercises.findMany({
    where: conditions.length ? and(...conditions) : undefined,
    orderBy: asc(exercises.name),
  });
}

export async function getExercise(id: number) {
  return db.query.exercises.findFirst({ where: eq(exercises.id, id) });
}

export type ExerciseFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function createExercise(
  _prevState: ExerciseFormState,
  formData: FormData
): Promise<ExerciseFormState> {
  await requireAdmin();

  const parsed = exerciseSchema.safeParse({
    name: formData.get("name"),
    bodyPart: formData.get("bodyPart"),
    equipment: formData.get("equipment"),
    gifUrl: formData.get("gifUrl"),
    target: formData.get("target"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await db.insert(exercises).values(parsed.data);
  revalidatePath("/exercises");
  revalidatePath("/admin/exercises");
}

export async function updateExercise(
  id: number,
  _prevState: ExerciseFormState,
  formData: FormData
): Promise<ExerciseFormState> {
  await requireAdmin();

  const parsed = exerciseSchema.safeParse({
    name: formData.get("name"),
    bodyPart: formData.get("bodyPart"),
    equipment: formData.get("equipment"),
    gifUrl: formData.get("gifUrl"),
    target: formData.get("target"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  await db.update(exercises).set(parsed.data).where(eq(exercises.id, id));
  revalidatePath("/exercises");
  revalidatePath(`/exercises/${id}`);
  revalidatePath("/admin/exercises");
}

export async function deleteExercise(id: number) {
  await requireAdmin();
  await db.delete(exercises).where(eq(exercises.id, id));
  revalidatePath("/exercises");
  revalidatePath("/admin/exercises");
}
