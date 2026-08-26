"use client";

import { useActionState } from "react";

import { createLoggedExercise } from "@/actions/logged-exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

export function LogExerciseForm({
  workoutId,
  exerciseId,
  exerciseName,
}: {
  workoutId: number;
  exerciseId: number;
  exerciseName: string;
}) {
  const [state, action, pending] = useActionState(
    createLoggedExercise,
    undefined
  );

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="workoutId" value={workoutId} />
      <input type="hidden" name="exerciseId" value={exerciseId} />

      <p className="text-sm text-muted-foreground">
        Logging <span className="font-medium capitalize">{exerciseName}</span>
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            min={0}
            defaultValue={0}
            required
          />
          {state?.errors?.weight && (
            <p className="text-sm text-destructive">{state.errors.weight[0]}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unit">Unit</Label>
          <Select name="unit" defaultValue="lbs">
            <SelectTrigger id="unit" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="lbs">lbs</SelectItem>
              <SelectItem value="kg">kg</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="noOfSets">Sets</Label>
          <Input
            id="noOfSets"
            name="noOfSets"
            type="number"
            min={1}
            defaultValue={3}
            required
          />
          {state?.errors?.noOfSets && (
            <p className="text-sm text-destructive">
              {state.errors.noOfSets[0]}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="noOfReps">Reps</Label>
          <Input
            id="noOfReps"
            name="noOfReps"
            type="number"
            min={1}
            defaultValue={10}
            required
          />
          {state?.errors?.noOfReps && (
            <p className="text-sm text-destructive">
              {state.errors.noOfReps[0]}
            </p>
          )}
        </div>
      </div>

      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Log exercise"}
      </Button>
    </form>
  );
}
