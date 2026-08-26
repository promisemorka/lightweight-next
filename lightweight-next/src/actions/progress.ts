"use server";

import { and, asc, desc, eq } from "drizzle-orm";

import { db } from "@/db";
import { requireUser } from "@/lib/auth-guards";
import { exercises, loggedExercises, workouts } from "../../drizzle/schema";

export type ExerciseHistoryEntry = {
  id: number;
  weight: number;
  unit: "lbs" | "kg";
  noOfSets: number;
  noOfReps: number;
  performedAt: Date;
};

export async function getExerciseHistory(
  exerciseId: number
): Promise<ExerciseHistoryEntry[]> {
  const user = await requireUser();

  return db
    .select({
      id: loggedExercises.id,
      weight: loggedExercises.weight,
      unit: loggedExercises.unit,
      noOfSets: loggedExercises.noOfSets,
      noOfReps: loggedExercises.noOfReps,
      performedAt: loggedExercises.performedAt,
    })
    .from(loggedExercises)
    .innerJoin(workouts, eq(loggedExercises.workoutId, workouts.id))
    .where(
      and(
        eq(loggedExercises.exerciseId, exerciseId),
        eq(workouts.userId, Number(user.id))
      )
    )
    .orderBy(asc(loggedExercises.performedAt));
}

export type PersonalRecord = {
  exerciseId: number;
  exerciseName: string;
  weight: number;
  unit: "lbs" | "kg";
  performedAt: Date;
};

export async function getPersonalRecords(): Promise<PersonalRecord[]> {
  const user = await requireUser();

  const rows = await db
    .select({
      exerciseId: exercises.id,
      exerciseName: exercises.name,
      weight: loggedExercises.weight,
      unit: loggedExercises.unit,
      performedAt: loggedExercises.performedAt,
    })
    .from(loggedExercises)
    .innerJoin(workouts, eq(loggedExercises.workoutId, workouts.id))
    .innerJoin(exercises, eq(loggedExercises.exerciseId, exercises.id))
    .where(eq(workouts.userId, Number(user.id)))
    .orderBy(desc(loggedExercises.weight), asc(loggedExercises.performedAt));

  const best = new Map<number, PersonalRecord>();
  for (const row of rows) {
    if (!best.has(row.exerciseId)) {
      best.set(row.exerciseId, row);
    }
  }

  return [...best.values()].sort((a, b) =>
    a.exerciseName.localeCompare(b.exerciseName)
  );
}
