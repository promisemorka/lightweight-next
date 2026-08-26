import { notFound } from "next/navigation";

import { getExercise, searchExercises } from "@/actions/exercises";
import { getWorkout } from "@/actions/workouts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { ExerciseFilterBar } from "@/components/exercises/exercise-filter-bar";
import { LogExerciseForm } from "@/components/workouts/log-exercise-form";

export default async function LogExercisePage({
  params,
  searchParams,
}: PageProps<"/workouts/[workoutId]/log/new">) {
  const { workoutId } = await params;
  const { exerciseId, name } = await searchParams;

  const workout = await getWorkout(Number(workoutId));
  if (!workout) notFound();

  if (typeof exerciseId === "string") {
    const exercise = await getExercise(Number(exerciseId));
    if (!exercise) notFound();

    return (
      <Card className="mx-auto max-w-md">
        <CardHeader>
          <CardTitle>Log exercise — {workout.dayOfWeek}</CardTitle>
        </CardHeader>
        <CardContent>
          <LogExerciseForm
            workoutId={workout.id}
            exerciseId={exercise.id}
            exerciseName={exercise.name}
          />
        </CardContent>
      </Card>
    );
  }

  const exercises = await searchExercises({
    name: typeof name === "string" ? name : undefined,
  });

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl text-primary">
        Choose an exercise — {workout.dayOfWeek}
      </h1>
      <ExerciseFilterBar basePath={`/workouts/${workout.id}/log/new`} />

      {exercises.length === 0 ? (
        <p className="text-muted-foreground">No exercises found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              href={`/workouts/${workout.id}/log/new?exerciseId=${exercise.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
