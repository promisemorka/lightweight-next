import { notFound } from "next/navigation";

import { getWorkout, updateWorkout } from "@/actions/workouts";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default async function EditWorkoutPage({
  params,
}: PageProps<"/workouts/[workoutId]/edit">) {
  const { workoutId } = await params;
  const workout = await getWorkout(Number(workoutId));
  if (!workout) notFound();

  const action = updateWorkout.bind(null, workout.id);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Edit workout day</CardTitle>
      </CardHeader>
      <CardContent>
        <WorkoutForm
          action={action}
          defaultDayOfWeek={workout.dayOfWeek}
          defaultDescription={workout.description}
          submitLabel="Save changes"
        />
      </CardContent>
    </Card>
  );
}
