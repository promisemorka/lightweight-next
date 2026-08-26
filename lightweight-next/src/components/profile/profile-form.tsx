"use client";

import { useActionState, useEffect } from "react";
import { toast } from "sonner";

import { updateProfile } from "@/actions/users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function ProfileForm({
  defaultFirstName,
  defaultLastName,
  defaultEmail,
}: {
  defaultFirstName: string;
  defaultLastName: string;
  defaultEmail: string;
}) {
  const [state, action, pending] = useActionState(updateProfile, undefined);

  useEffect(() => {
    if (state?.message && !state.errors) {
      toast.success(state.message);
    }
  }, [state]);

  return (
    <form action={action} className="grid gap-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="grid gap-2">
          <Label htmlFor="firstName">First name</Label>
          <Input
            id="firstName"
            name="firstName"
            defaultValue={defaultFirstName}
            required
          />
          {state?.errors?.firstName && (
            <p className="text-sm text-destructive">
              {state.errors.firstName[0]}
            </p>
          )}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="lastName">Last name</Label>
          <Input
            id="lastName"
            name="lastName"
            defaultValue={defaultLastName}
            required
          />
          {state?.errors?.lastName && (
            <p className="text-sm text-destructive">
              {state.errors.lastName[0]}
            </p>
          )}
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="email">Email</Label>
        <Input
          id="email"
          name="email"
          type="email"
          defaultValue={defaultEmail}
          required
        />
        {state?.errors?.email && (
          <p className="text-sm text-destructive">{state.errors.email[0]}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">Confirm current password to save</Label>
        <Input id="password" name="password" type="password" required />
        {state?.errors?.password && (
          <p className="text-sm text-destructive">
            {state.errors.password[0]}
          </p>
        )}
      </div>
      <Button type="submit" disabled={pending}>
        {pending ? "Saving…" : "Save changes"}
      </Button>
    </form>
  );
}
