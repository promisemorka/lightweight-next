import { describe, expect, it } from "vitest";

import {
  loggedExerciseSchema,
  loggedExerciseUpdateSchema,
} from "./logged-exercise";

describe("loggedExerciseSchema", () => {
  const valid = {
    workoutId: "1",
    exerciseId: "2",
    weight: "135",
    unit: "lbs",
    noOfSets: "5",
    noOfReps: "5",
  };

  it("coerces string form-data values into numbers", () => {
    expect(loggedExerciseSchema.parse(valid)).toEqual({
      workoutId: 1,
      exerciseId: 2,
      weight: 135,
      unit: "lbs",
      noOfSets: 5,
      noOfReps: 5,
    });
  });

  it("rejects a zero or negative set count", () => {
    expect(
      loggedExerciseSchema.safeParse({ ...valid, noOfSets: "0" }).success,
    ).toBe(false);
  });

  it("rejects a unit outside lbs/kg", () => {
    expect(
      loggedExerciseSchema.safeParse({ ...valid, unit: "stone" }).success,
    ).toBe(false);
  });

  it("allows a weight of 0 (bodyweight exercises)", () => {
    expect(
      loggedExerciseSchema.safeParse({ ...valid, weight: "0" }).success,
    ).toBe(true);
  });
});

describe("loggedExerciseUpdateSchema", () => {
  it("accepts the editable fields without workoutId/exerciseId", () => {
    expect(
      loggedExerciseUpdateSchema.safeParse({
        weight: "140",
        unit: "lbs",
        noOfSets: "5",
        noOfReps: "5",
      }).success,
    ).toBe(true);
  });
});
