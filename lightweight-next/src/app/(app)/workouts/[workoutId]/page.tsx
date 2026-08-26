import Link from "next/link";
import { notFound } from "next/navigation";
import { Plus } from "lucide-react";

import { getWorkout } from "@/actions/workouts";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { WorkoutDayMenu } from "@/components/workouts/workout-day-menu";
import { LoggedExerciseMenu } from "@/components/workouts/logged-exercise-menu";

export default async function WorkoutDayPage({
  params,
}: PageProps<"/workouts/[workoutId]">) {
  const { workoutId } = await params;
  const workout = await getWorkout(Number(workoutId));
  if (!workout) notFound();

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between">
        <div>
          <CardTitle className="text-xl">{workout.dayOfWeek}</CardTitle>
          <p className="text-muted-foreground">{workout.description}</p>
        </div>
        <WorkoutDayMenu workoutId={workout.id} />
      </CardHeader>
      <CardContent className="grid gap-4">
        <div className="flex items-center justify-between">
          <h2 className="font-heading text-xl">Logged exercises</h2>
          <Button size="sm" asChild>
            <Link href={`/workouts/${workout.id}/log/new`}>
              <Plus />
              Log exercise
            </Link>
          </Button>
        </div>

        {workout.loggedExercises.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No exercises logged for this day yet.
          </p>
        ) : (
          <ul className="divide-y">
            {workout.loggedExercises.map((entry, index) => (
              <li
                key={entry.id}
                className="flex items-center justify-between py-3"
              >
                <div>
                  <p className="font-medium">
                    {index + 1}. {entry.exercise.name}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {entry.noOfSets} sets × {entry.noOfReps} reps @{" "}
                    {entry.weight} {entry.unit}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/exercises/${entry.exercise.id}`}>View</Link>
                  </Button>
                  <LoggedExerciseMenu
                    workoutId={workout.id}
                    loggedExerciseId={entry.id}
                  />
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
