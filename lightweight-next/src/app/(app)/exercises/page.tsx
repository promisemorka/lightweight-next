import { searchExercises } from "@/actions/exercises";
import { ExerciseCard } from "@/components/exercises/exercise-card";
import { ExerciseFilterBar } from "@/components/exercises/exercise-filter-bar";

export default async function ExercisesPage({
  searchParams,
}: PageProps<"/exercises">) {
  const { name } = await searchParams;
  const exercises = await searchExercises({
    name: typeof name === "string" ? name : undefined,
  });

  return (
    <div className="grid gap-4">
      <h1 className="font-heading text-3xl text-primary">Exercises</h1>
      <ExerciseFilterBar basePath="/exercises" />

      {exercises.length === 0 ? (
        <p className="text-muted-foreground">No exercises found.</p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {exercises.map((exercise) => (
            <ExerciseCard
              key={exercise.id}
              exercise={exercise}
              href={`/exercises/${exercise.id}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}
