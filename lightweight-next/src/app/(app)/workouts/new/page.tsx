import { createWorkout } from "@/actions/workouts";
import { WorkoutForm } from "@/components/workouts/workout-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function NewWorkoutPage() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Add a workout day</CardTitle>
      </CardHeader>
      <CardContent>
        <WorkoutForm action={createWorkout} submitLabel="Create workout" />
      </CardContent>
    </Card>
  );
}
