import { describe, expect, it } from "vitest";

import { exerciseSchema, exerciseSearchSchema } from "./exercise";

describe("exerciseSchema", () => {
  const valid = {
    name: "Barbell Bench Press",
    bodyPart: "Chest",
    equipment: "Barbell",
    gifUrl: "https://example.com/bench-press.gif",
    target: "Pectorals",
  };

  it("accepts a fully valid exercise payload", () => {
    expect(exerciseSchema.safeParse(valid).success).toBe(true);
  });

  it("rejects a missing name", () => {
    expect(exerciseSchema.safeParse({ ...valid, name: "" }).success).toBe(
      false,
    );
  });

  it("rejects a non-URL gifUrl", () => {
    expect(
      exerciseSchema.safeParse({ ...valid, gifUrl: "not-a-url" }).success,
    ).toBe(false);
  });
});

describe("exerciseSearchSchema", () => {
  it("accepts an empty search (all filters optional)", () => {
    expect(exerciseSearchSchema.safeParse({}).success).toBe(true);
  });

  it("accepts a partial search", () => {
    expect(
      exerciseSearchSchema.safeParse({ bodyPart: "Chest" }).success,
    ).toBe(true);
  });
});
