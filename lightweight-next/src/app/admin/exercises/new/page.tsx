import { createExercise } from "@/actions/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseAdminForm } from "@/components/exercises/exercise-admin-form";

export default function NewExercisePage() {
  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>New exercise</CardTitle>
      </CardHeader>
      <CardContent>
        <ExerciseAdminForm action={createExercise} submitLabel="Create exercise" />
      </CardContent>
    </Card>
  );
}
