import "server-only";

import { eq } from "drizzle-orm";

import { auth } from "@/auth";
import { db } from "@/db";
import { loggedExercises, workouts } from "../../drizzle/schema";

export class UnauthorizedError extends Error {
  constructor(message = "You must be logged in to do that") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

export class ForbiddenError extends Error {
  constructor(message = "You are not allowed to do that") {
    super(message);
    this.name = "ForbiddenError";
  }
}

export class NotFoundError extends Error {
  constructor(message = "Not found") {
    super(message);
    this.name = "NotFoundError";
  }
}

export async function requireUser() {
  const session = await auth();
  if (!session?.user) throw new UnauthorizedError();
  return session.user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (!user.isAdmin) throw new ForbiddenError();
  return user;
}

export async function requireWorkoutOwner(workoutId: number) {
  const user = await requireUser();
  const workout = await db.query.workouts.findFirst({
    where: eq(workouts.id, workoutId),
  });
  if (!workout) throw new NotFoundError("Workout not found");
  if (workout.userId !== Number(user.id) && !user.isAdmin) {
    throw new ForbiddenError();
  }
  return workout;
}

export async function requireLoggedExerciseOwner(loggedExerciseId: number) {
  const user = await requireUser();
  const row = await db.query.loggedExercises.findFirst({
    where: eq(loggedExercises.id, loggedExerciseId),
    with: { workout: true },
  });
  if (!row) throw new NotFoundError("Logged exercise not found");
  if (row.workout.userId !== Number(user.id) && !user.isAdmin) {
    throw new ForbiddenError();
  }
  return row;
}
