import { describe, expect, it } from "vitest";

import { DAYS_OF_WEEK, workoutSchema } from "./workout";

describe("workoutSchema", () => {
  it("accepts every day in DAYS_OF_WEEK", () => {
    for (const day of DAYS_OF_WEEK) {
      expect(
        workoutSchema.safeParse({ dayOfWeek: day, description: "Chest day" })
          .success,
      ).toBe(true);
    }
  });

  it("rejects a day of week outside the allowed set", () => {
    expect(
      workoutSchema.safeParse({
        dayOfWeek: "Someday",
        description: "Chest day",
      }).success,
    ).toBe(false);
  });

  it("rejects an empty description", () => {
    expect(
      workoutSchema.safeParse({ dayOfWeek: "Monday", description: "" })
        .success,
    ).toBe(false);
  });
});
