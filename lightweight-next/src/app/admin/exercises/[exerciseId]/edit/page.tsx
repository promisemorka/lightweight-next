import { notFound } from "next/navigation";

import { getExercise, updateExercise } from "@/actions/exercises";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ExerciseAdminForm } from "@/components/exercises/exercise-admin-form";

export default async function EditExercisePage({
  params,
}: PageProps<"/admin/exercises/[exerciseId]/edit">) {
  const { exerciseId } = await params;
  const exercise = await getExercise(Number(exerciseId));
  if (!exercise) notFound();

  const action = updateExercise.bind(null, exercise.id);

  return (
    <Card className="mx-auto max-w-md">
      <CardHeader>
        <CardTitle>Edit exercise</CardTitle>
      </CardHeader>
      <CardContent>
        <ExerciseAdminForm
          action={action}
          defaultValues={exercise}
          submitLabel="Save changes"
        />
      </CardContent>
    </Card>
  );
}
