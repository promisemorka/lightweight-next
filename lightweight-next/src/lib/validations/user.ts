import { z } from "zod";

export const profileUpdateSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.email("Must be a valid email"),
  password: z.string().min(1, "Current password is required to save changes"),
});

export const adminCreateUserSchema = z.object({
  username: z.string().min(3).max(25),
  password: z.string().min(6),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  email: z.email(),
  isAdmin: z.boolean().default(false),
});

export type ProfileUpdateInput = z.infer<typeof profileUpdateSchema>;
export type AdminCreateUserInput = z.infer<typeof adminCreateUserSchema>;
