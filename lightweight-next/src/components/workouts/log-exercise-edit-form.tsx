"use client";

import { useActionState } from "react";

import type { LoggedExerciseFormState } from "@/actions/logged-exercises";
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

type Action = (
  state: LoggedExerciseFormState,
  formData: FormData
) => Promise<LoggedExerciseFormState>;

export function LogExerciseEditForm({
  action,
  exerciseName,
  defaultWeight,
  defaultUnit,
  defaultNoOfSets,
  defaultNoOfReps,
}: {
  action: Action;
  exerciseName: string;
  defaultWeight: number;
  defaultUnit: string;
  defaultNoOfSets: number;
  defaultNoOfReps: number;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <p className="text-sm text-muted-foreground">
        Editing <span className="font-medium capitalize">{exerciseName}</span>
      </p>

      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="weight">Weight</Label>
          <Input
            id="weight"
            name="weight"
            type="number"
            min={0}
            defaultValue={defaultWeight}
            required
          />
          {state?.errors?.weight && (
            <p className="text-sm text-destructive">{state.errors.weight[0]}</p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="unit">Unit</Label>
          <Select name="unit" defaultValue={defaultUnit}>
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
            defaultValue={defaultNoOfSets}
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
            defaultValue={defaultNoOfReps}
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
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
