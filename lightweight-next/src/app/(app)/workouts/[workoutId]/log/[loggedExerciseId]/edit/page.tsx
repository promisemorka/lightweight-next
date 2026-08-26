import { notFound } from "next/navigation";

import { getLoggedExercise, updateLoggedExercise } from "@/actions/logged-exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LogExerciseEditForm } from "@/components/workouts/log-exercise-edit-form";

export default async function EditLoggedExercisePage({
  params,
}: PageProps<"/workouts/[workoutId]/log/[loggedExerciseId]/edit">) {
  const { loggedExerciseId } = await params;
  const row = await getLoggedExercise(Number(loggedExerciseId));
  if (!row) notFound();

  const action = updateLoggedExercise.bind(null, row.id);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Edit logged exercise</CardTitle>
      </CardHeader>
      <CardContent>
        <LogExerciseEditForm
          action={action}
          exerciseName={row.exercise.name}
          defaultWeight={row.weight}
          defaultUnit={row.unit}
          defaultNoOfSets={row.noOfSets}
          defaultNoOfReps={row.noOfReps}
        />
      </CardContent>
    </Card>
  );
}
