import { describe, expect, it } from "vitest";

import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
  it("accepts a valid login payload", () => {
    expect(
      loginSchema.safeParse({ username: "jdoe", password: "secret" }).success,
    ).toBe(true);
  });

  it("rejects an empty username", () => {
    expect(
      loginSchema.safeParse({ username: "", password: "secret" }).success,
    ).toBe(false);
  });

  it("rejects an empty password", () => {
    expect(
      loginSchema.safeParse({ username: "jdoe", password: "" }).success,
    ).toBe(false);
  });
});

describe("registerSchema", () => {
  const valid = {
    username: "jdoe",
    password: "secret1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
  };

  it("accepts a fully valid registration payload", () => {
    expect(registerSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a username shorter than 3 characters", () => {
    expect(
      registerSchema.safeParse({ ...valid, username: "ab" }).success,
    ).toBe(false);
  });

  it("rejects a password shorter than 6 characters", () => {
    expect(
      registerSchema.safeParse({ ...valid, password: "abc12" }).success,
    ).toBe(false);
  });

  it("rejects an invalid email", () => {
    expect(
      registerSchema.safeParse({ ...valid, email: "not-an-email" }).success,
    ).toBe(false);
  });
});
