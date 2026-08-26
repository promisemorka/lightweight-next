"use client";

import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { deleteLoggedExercise } from "@/actions/logged-exercises";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function LoggedExerciseMenu({
  workoutId,
  loggedExerciseId,
}: {
  workoutId: number;
  loggedExerciseId: number;
}) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/workouts/${workoutId}/log/${loggedExerciseId}/edit`}>
            <Pencil />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild variant="destructive">
          <form
            action={deleteLoggedExercise.bind(null, loggedExerciseId)}
            className="w-full"
          >
            <button type="submit" className="flex w-full items-center gap-2">
              <Trash2 />
              Delete
            </button>
          </form>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
