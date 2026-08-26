"use client";

import { useActionState } from "react";
import Link from "next/link";

import { registerUser, type RegisterState } from "@/actions/auth";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const initialState: RegisterState = undefined;

export function SignupForm() {
  const [state, action, pending] = useActionState(registerUser, initialState);

  return (
    <Card className="w-full max-w-sm">
      <CardHeader>
        <CardTitle>Sign up</CardTitle>
        <CardDescription>
          Already have an account?{" "}
          <Link href="/login" className="underline">
            Log in
          </Link>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={action} className="grid gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="grid gap-2">
              <Label htmlFor="firstName">First name</Label>
              <Input id="firstName" name="firstName" required />
              {state?.errors?.firstName && (
                <p className="text-sm text-destructive">
                  {state.errors.firstName[0]}
                </p>
              )}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="lastName">Last name</Label>
              <Input id="lastName" name="lastName" required />
              {state?.errors?.lastName && (
                <p className="text-sm text-destructive">
                  {state.errors.lastName[0]}
                </p>
              )}
            </div>
          </div>
          <div className="grid gap-2">
            <Label htmlFor="username">Username</Label>
            <Input id="username" name="username" required />
            {state?.errors?.username && (
              <p className="text-sm text-destructive">
                {state.errors.username[0]}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" name="email" type="email" required />
            {state?.errors?.email && (
              <p className="text-sm text-destructive">
                {state.errors.email[0]}
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" name="password" type="password" required />
            {state?.errors?.password && (
              <p className="text-sm text-destructive">
                {state.errors.password[0]}
              </p>
            )}
          </div>
          <Button type="submit" disabled={pending} className="w-full">
            {pending ? "Signing up…" : "Sign up"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
