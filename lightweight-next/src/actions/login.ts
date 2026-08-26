"use server";

import { AuthError } from "next-auth";

import { signIn } from "@/auth";

export type LoginState = { message?: string } | undefined;

export async function loginAction(
  _prevState: LoginState,
  formData: FormData
): Promise<LoginState> {
  try {
    await signIn("credentials", {
      username: formData.get("username"),
      password: formData.get("password"),
      redirectTo: "/workouts",
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return { message: "Invalid username or password" };
    }
    throw error;
  }
}
