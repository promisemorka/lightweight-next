import { describe, expect, it } from "vitest";

import { adminCreateUserSchema, profileUpdateSchema } from "./user";

describe("profileUpdateSchema", () => {
  const valid = {
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
    password: "currentpassword",
  };

  it("accepts a valid profile update", () => {
    expect(profileUpdateSchema.safeParse(valid).success).toBe(true);
  });

  it("requires the current password to be present", () => {
    expect(
      profileUpdateSchema.safeParse({ ...valid, password: "" }).success,
    ).toBe(false);
  });
});

describe("adminCreateUserSchema", () => {
  const valid = {
    username: "newadmin",
    password: "secret1",
    firstName: "Jane",
    lastName: "Doe",
    email: "jane@example.com",
  };

  it("defaults isAdmin to false when omitted", () => {
    expect(adminCreateUserSchema.parse(valid).isAdmin).toBe(false);
  });

  it("rejects a username shorter than 3 characters", () => {
    expect(
      adminCreateUserSchema.safeParse({ ...valid, username: "ab" }).success,
    ).toBe(false);
  });
});
