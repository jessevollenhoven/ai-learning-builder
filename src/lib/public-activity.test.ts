// Covers public availability and content validation for shared activities.
import { describe, expect, it } from "vitest";
import { getPublicActivityContent } from "./public-activity";
import { sampleQuiz } from "./sample-data";

describe("getPublicActivityContent", () => {
  it("returns valid shared multiple-choice content", () => {
    expect(getPublicActivityContent({
      type: "multiple_choice",
      shared: true,
      content: sampleQuiz,
    })).toEqual(sampleQuiz);
  });

  it("returns null for a missing activity", () => {
    expect(getPublicActivityContent(null)).toBeNull();
  });

  it("returns null for an unshared activity", () => {
    expect(getPublicActivityContent({
      type: "multiple_choice",
      shared: false,
      content: sampleQuiz,
    })).toBeNull();
  });

  it("returns null for an unsupported activity type", () => {
    expect(getPublicActivityContent({
      type: "flashcards",
      shared: true,
      content: sampleQuiz,
    })).toBeNull();
  });

  it("returns null for invalid content", () => {
    expect(getPublicActivityContent({
      type: "multiple_choice",
      shared: true,
      content: { type: "multiple_choice", questions: [] },
    })).toBeNull();
  });
});