"use client";

import { useActionState } from "react";

import type { WorkoutFormState } from "@/actions/workouts";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DAYS_OF_WEEK } from "@/lib/validations/workout";

type WorkoutFormAction = (
  state: WorkoutFormState,
  formData: FormData
) => Promise<WorkoutFormState>;

export function WorkoutForm({
  action,
  defaultDayOfWeek,
  defaultDescription,
  submitLabel,
}: {
  action: WorkoutFormAction;
  defaultDayOfWeek?: string;
  defaultDescription?: string;
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  return (
    <form action={formAction} className="grid gap-4">
      <div className="grid gap-2">
        <Label htmlFor="dayOfWeek">Day of week</Label>
        <Select name="dayOfWeek" defaultValue={defaultDayOfWeek}>
          <SelectTrigger id="dayOfWeek" className="w-full">
            <SelectValue placeholder="Choose a day" />
          </SelectTrigger>
          <SelectContent>
            {DAYS_OF_WEEK.map((day) => (
              <SelectItem key={day} value={day}>
                {day}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {state?.errors?.dayOfWeek && (
          <p className="text-sm text-destructive">
            {state.errors.dayOfWeek[0]}
          </p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="description">Description</Label>
        <Textarea
          id="description"
          name="description"
          defaultValue={defaultDescription}
          placeholder="e.g. Push day — chest, shoulders, triceps"
          required
        />
        {state?.errors?.description && (
          <p className="text-sm text-destructive">
            {state.errors.description[0]}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
