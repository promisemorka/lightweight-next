"use client";

import { useActionState } from "react";

import type { ExerciseFormState } from "@/actions/exercises";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Action = (
  state: ExerciseFormState,
  formData: FormData
) => Promise<ExerciseFormState>;

export function ExerciseAdminForm({
  action,
  defaultValues,
  submitLabel,
}: {
  action: Action;
  defaultValues?: {
    name: string;
    bodyPart: string;
    equipment: string;
    gifUrl: string;
    target: string;
  };
  submitLabel: string;
}) {
  const [state, formAction, pending] = useActionState(action, undefined);

  const fields = [
    { name: "name", label: "Name" },
    { name: "bodyPart", label: "Body part" },
    { name: "equipment", label: "Equipment" },
    { name: "gifUrl", label: "GIF URL" },
    { name: "target", label: "Target" },
  ] as const;

  return (
    <form action={formAction} className="grid gap-4">
      {fields.map((field) => (
        <div key={field.name} className="grid gap-2">
          <Label htmlFor={field.name}>{field.label}</Label>
          <Input
            id={field.name}
            name={field.name}
            defaultValue={defaultValues?.[field.name]}
            required
          />
          {state?.errors?.[field.name] && (
            <p className="text-sm text-destructive">
              {state.errors[field.name][0]}
            </p>
          )}
        </div>
      ))}
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : submitLabel}
      </Button>
    </form>
  );
}
