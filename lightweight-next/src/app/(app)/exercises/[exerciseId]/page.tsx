import Link from "next/link";
import { notFound } from "next/navigation";
import { Trophy } from "lucide-react";

import { getExercise } from "@/actions/exercises";
import { getExerciseHistory } from "@/actions/progress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { WeightProgressChart } from "@/components/progress/weight-progress-chart";

const dateFormatter = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  year: "numeric",
});

export default async function ExerciseDetailPage({
  params,
  searchParams,
}: PageProps<"/exercises/[exerciseId]">) {
  const { exerciseId } = await params;
  const { workoutId } = await searchParams;
  const exercise = await getExercise(Number(exerciseId));
  if (!exercise) notFound();

  const history = await getExerciseHistory(exercise.id);
  const personalRecord = history.reduce<(typeof history)[number] | null>(
    (best, entry) => (!best || entry.weight > best.weight ? entry : best),
    null
  );

  return (
    <div className="mx-auto grid max-w-2xl gap-6">
      <Card className="overflow-hidden">
        <div className="bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={exercise.gifUrl}
            alt={exercise.name}
            className="mx-auto max-h-80"
          />
        </div>
        <CardHeader>
          <CardTitle className="capitalize">{exercise.name}</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Body part: {exercise.bodyPart}</Badge>
            <Badge variant="secondary">Target: {exercise.target}</Badge>
            <Badge variant="secondary">Equipment: {exercise.equipment}</Badge>
          </div>
          {typeof workoutId === "string" && (
            <Button asChild>
              <Link
                href={`/workouts/${workoutId}/log/new?exerciseId=${exercise.id}`}
              >
                Log this exercise
              </Link>
            </Button>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your progress</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4">
          {history.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              You haven&apos;t logged this exercise yet — log a set from one of
              your workout days to start tracking progress.
            </p>
          ) : (
            <>
              {personalRecord && (
                <div className="flex items-center gap-3 rounded-lg border bg-accent/40 p-3">
                  <Trophy className="size-8 text-primary" />
                  <div>
                    <p className="text-xs text-muted-foreground">
                      Personal record
                    </p>
                    <p className="font-heading text-2xl">
                      {personalRecord.weight} {personalRecord.unit}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      set on {dateFormatter.format(personalRecord.performedAt)}
                    </p>
                  </div>
                </div>
              )}

              <WeightProgressChart
                data={history.map((entry) => ({
                  id: entry.id,
                  performedAt: entry.performedAt.toISOString(),
                  weight: entry.weight,
                  noOfSets: entry.noOfSets,
                  noOfReps: entry.noOfReps,
                }))}
                unit={history[0]?.unit ?? "lbs"}
              />

              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Weight</TableHead>
                    <TableHead>Sets × Reps</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {[...history].reverse().map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>
                        {dateFormatter.format(entry.performedAt)}
                      </TableCell>
                      <TableCell>
                        {entry.weight} {entry.unit}
                      </TableCell>
                      <TableCell>
                        {entry.noOfSets} × {entry.noOfReps}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
