// Protects the activity insert payload from including an owner identifier.
import { describe, expect, it } from "vitest";
import { buildActivityInsert } from "./activity-utils";
import { sampleQuiz } from "./sample-data";

describe("buildActivityInsert", () => {
  it("includes only the activity fields and leaves ownership to the database", () => {
    const insert = buildActivityInsert(sampleQuiz);

    expect(insert).toEqual({
      type: "multiple_choice",
      title: sampleQuiz.title,
      content: sampleQuiz,
    });
    expect(insert).not.toHaveProperty("owner_id");
  });
});