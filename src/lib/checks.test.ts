// Covers successful content and each quality-check failure.
import { describe, expect, it } from "vitest";
import { checkMultipleChoiceContent } from "./checks";
import { multipleChoiceContentSchema, type MultipleChoiceContent } from "./schemas";
import { sampleQuiz } from "./sample-data";

function makeContent(questionCount = 5): MultipleChoiceContent {
  return {
    type: "multiple_choice",
    title: "Water cycle",
    instructions: "Choose the best answer.",
    questions: Array.from({ length: questionCount }, (_, index) => ({
      question: `Question ${index + 1}?`,
      options: ["First", "Second", "Third", "Fourth"],
      correctIndex: 0,
      explanation: "The first option is correct.",
    })),
  };
}

describe("checkMultipleChoiceContent", () => {
  it("accepts clear content with distinct options and a sensible question count", () => {
    expect(checkMultipleChoiceContent(makeContent())).toEqual([]);
  });

  it("keeps the sample quiz valid against its schema and content checks", () => {
    const result = multipleChoiceContentSchema.safeParse(sampleQuiz);

    expect(result.success).toBe(true);
    if (result.success) {
      expect(checkMultipleChoiceContent(result.data)).toEqual([]);
    }
  });

  it("reports too few questions", () => {
    expect(checkMultipleChoiceContent(makeContent(4))).toContain("A quiz must have between 5 and 15 questions");
  });

  it("reports too many questions", () => {
    expect(checkMultipleChoiceContent(makeContent(16))).toContain("A quiz must have between 5 and 15 questions");
  });

  it("accepts text at the phone-friendly limits", () => {
    const content = makeContent();
    content.title = "T".repeat(70);
    content.instructions = "I".repeat(180);
    content.questions[0].question = "Q".repeat(180);
    content.questions[0].options[0] = "O".repeat(75);
    content.questions[0].explanation = "E".repeat(180);

    expect(checkMultipleChoiceContent(content)).toEqual([]);
  });

  it("reports text that exceeds phone-friendly limits", () => {
    const content = makeContent();
    content.title = "T".repeat(71);
    content.instructions = "I".repeat(181);
    content.questions[0].question = "Q".repeat(181);
    content.questions[0].options[0] = "O".repeat(76);
    content.questions[0].explanation = "E".repeat(181);

    expect(checkMultipleChoiceContent(content)).toEqual([
      "The title must be 70 characters or fewer",
      "Instructions must be 180 characters or fewer",
      "Question 1 is too long (maximum 180 characters)",
      "Question 1 has an option that is too long (maximum 75 characters)",
      "Question 1 has an explanation that is too long (maximum 180 characters)",
    ]);
  });

  it("accepts distinct options regardless of case and surrounding whitespace", () => {
    const content = makeContent();
    content.questions[0].options = ["River", "Rain", "Cloud", "Ocean"];

    expect(checkMultipleChoiceContent(content)).toEqual([]);
  });

  it("reports duplicate options ignoring case and surrounding whitespace", () => {
    const content = makeContent();
    content.questions[3].options = ["River", " rain ", "Rain", "Ocean"];

    expect(checkMultipleChoiceContent(content)).toContain("Question 4 has two identical options");
  });
});