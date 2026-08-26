import Link from "next/link";
import { Plus } from "lucide-react";

import { getWorkoutsForCurrentUser } from "@/actions/workouts";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default async function WorkoutsPage() {
  const workouts = await getWorkoutsForCurrentUser();

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-primary">Your workouts</h1>
        {workouts.length < 7 && (
          <Button asChild>
            <Link href="/workouts/new">
              <Plus />
              Add workout day
            </Link>
          </Button>
        )}
      </div>

      {workouts.length === 0 ? (
        <p className="text-muted-foreground">
          You haven&apos;t added any workout days yet.
        </p>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2">
          {workouts.map((workout) => (
            <Link key={workout.id} href={`/workouts/${workout.id}`}>
              <Card className="transition-colors hover:bg-muted/50">
                <CardHeader>
                  <CardTitle>{workout.dayOfWeek}</CardTitle>
                  <CardDescription>{workout.description}</CardDescription>
                  <CardDescription>
                    {workout.loggedExercises.length} exercise
                    {workout.loggedExercises.length === 1 ? "" : "s"} logged
                  </CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
