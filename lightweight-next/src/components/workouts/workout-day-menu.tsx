"use client";

import Link from "next/link";
import { MoreVertical, Pencil, Trash2 } from "lucide-react";

import { deleteWorkout } from "@/actions/workouts";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export function WorkoutDayMenu({ workoutId }: { workoutId: number }) {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon-sm">
          <MoreVertical />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem asChild>
          <Link href={`/workouts/${workoutId}/edit`}>
            <Pencil />
            Edit
          </Link>
        </DropdownMenuItem>
        <DropdownMenuItem asChild variant="destructive">
          <form action={deleteWorkout.bind(null, workoutId)} className="w-full">
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
