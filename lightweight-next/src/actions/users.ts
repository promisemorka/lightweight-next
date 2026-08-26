"use server";

import bcrypt from "bcrypt";
import { asc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";

import { db } from "@/db";
import { requireAdmin, requireUser } from "@/lib/auth-guards";
import { signOut } from "@/auth";
import { adminCreateUserSchema, profileUpdateSchema } from "@/lib/validations/user";
import { users } from "../../drizzle/schema";

const BCRYPT_WORK_FACTOR = 12;

export type ProfileFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function updateProfile(
  _prevState: ProfileFormState,
  formData: FormData
): Promise<ProfileFormState> {
  const sessionUser = await requireUser();

  const parsed = profileUpdateSchema.safeParse({
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const user = await db.query.users.findFirst({
    where: eq(users.id, Number(sessionUser.id)),
  });
  if (!user) return { message: "User not found" };

  const passwordsMatch = await bcrypt.compare(parsed.data.password, user.passwordHash);
  if (!passwordsMatch) {
    return { errors: { password: ["Incorrect password"] } };
  }

  await db
    .update(users)
    .set({
      firstName: parsed.data.firstName,
      lastName: parsed.data.lastName,
      email: parsed.data.email,
    })
    .where(eq(users.id, user.id));

  revalidatePath("/profile");
  return { message: "Profile updated successfully" };
}

export async function listUsers() {
  await requireAdmin();
  return db.query.users.findMany({
    columns: {
      id: true,
      username: true,
      firstName: true,
      lastName: true,
      email: true,
      isAdmin: true,
    },
    orderBy: asc(users.username),
  });
}

export type AdminCreateUserFormState = {
  errors?: Record<string, string[]>;
  message?: string;
} | undefined;

export async function adminCreateUser(
  _prevState: AdminCreateUserFormState,
  formData: FormData
): Promise<AdminCreateUserFormState> {
  await requireAdmin();

  const parsed = adminCreateUserSchema.safeParse({
    username: formData.get("username"),
    password: formData.get("password"),
    firstName: formData.get("firstName"),
    lastName: formData.get("lastName"),
    email: formData.get("email"),
    isAdmin: formData.get("isAdmin") === "on",
  });
  if (!parsed.success) {
    return { errors: parsed.error.flatten().fieldErrors as Record<string, string[]> };
  }

  const existing = await db.query.users.findFirst({
    where: eq(users.username, parsed.data.username),
  });
  if (existing) {
    return { errors: { username: ["Username is already taken"] } };
  }

  const passwordHash = await bcrypt.hash(parsed.data.password, BCRYPT_WORK_FACTOR);
  await db.insert(users).values({ ...parsed.data, passwordHash });

  revalidatePath("/admin/users");
}

export async function adminDeleteUser(userId: number) {
  await requireAdmin();
  await db.delete(users).where(eq(users.id, userId));
  revalidatePath("/admin/users");
}

export async function logout() {
  await signOut({ redirectTo: "/" });
}
