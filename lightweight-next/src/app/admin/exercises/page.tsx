import Link from "next/link";
import { Plus, Trash2 } from "lucide-react";

import { deleteExercise, searchExercises } from "@/actions/exercises";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

export default async function AdminExercisesPage() {
  const exercises = await searchExercises({});

  return (
    <div className="grid gap-4">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-3xl text-primary">Manage exercises</h1>
        <Button asChild>
          <Link href="/admin/exercises/new">
            <Plus />
            New exercise
          </Link>
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Body part</TableHead>
            <TableHead>Target</TableHead>
            <TableHead className="w-0" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {exercises.map((exercise) => (
            <TableRow key={exercise.id}>
              <TableCell className="capitalize">
                <Link
                  href={`/admin/exercises/${exercise.id}/edit`}
                  className="hover:underline"
                >
                  {exercise.name}
                </Link>
              </TableCell>
              <TableCell className="capitalize">{exercise.bodyPart}</TableCell>
              <TableCell className="capitalize">{exercise.target}</TableCell>
              <TableCell>
                <form action={deleteExercise.bind(null, exercise.id)}>
                  <Button variant="ghost" size="icon-sm" type="submit">
                    <Trash2 />
                  </Button>
                </form>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
