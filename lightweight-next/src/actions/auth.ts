"use server";

import bcrypt from "bcrypt";
import { eq } from "drizzle-orm";

import { db } from "@/db";
import { registerSchema } from "@/lib/validations/auth";
import { signIn } from "@/auth";
import { users } from "../../drizzle/schema";

const BCRYPT_WORK_FACTOR = 12;

export type RegisterState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function registerUser(
  _prevState: RegisterState,
  formData: FormData
): Promise<RegisterState> {
  const parsed = registerSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
  });

  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const { username, password, firstName, lastName, email } = parsed.data;

  const existing = await db.query.users.findFirst({
    where: eq(users.username, username),
  });
  if (existing) {
    return { errors: { username: ["Username is already taken"] } };
  }

  const passwordHash = await bcrypt.hash(password, BCRYPT_WORK_FACTOR);

  await db.insert(users).values({
    username,
    passwordHash,
    firstName,
    lastName,
    email,
    isAdmin: false,
  });

  await signIn("credentials", { username, password, redirectTo: "/workouts" });
}
