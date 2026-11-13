// Covers successful content and each quality-check failure.
import { describe, expect, it } from "vitest";
import {
  checkFlashcardsContent,
  checkMatchingContent,
  checkMultipleChoiceContent,
  checkTrueFalseContent,
  validateFlashcardsContent,
  validateMatchingContent,
  validateMultipleChoiceContent,
  validateTrueFalseContent,
} from "./checks";
import {
  generateRequestSchema,
  multipleChoiceContentSchema,
  type FlashcardsContent,
  type MatchingContent,
  type MultipleChoiceContent,
  type TrueFalseContent,
} from "./schemas";
import { getRefinedSampleQuiz, sampleFlashcards, sampleMatching, sampleQuiz } from "./sample-data";

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

function makeTrueFalseContent(statementCount = 5): TrueFalseContent {
  return {
    type: "true_false",
    title: "Water cycle facts",
    instructions: "Decide whether each statement is true or false.",
    statements: Array.from({ length: statementCount }, (_, index) => ({
      statement: `Statement ${index + 1}`,
      answer: index % 2 === 0,
      explanation: "Water changes state as it moves through the cycle.",
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

  it("creates a schema-valid fake refinement with a refined title", () => {
    const refined = getRefinedSampleQuiz();
    const result = multipleChoiceContentSchema.safeParse(refined);

    expect(refined.title).toBe(`${sampleQuiz.title} (refined)`);
    expect(result.success).toBe(true);
    expect(checkMultipleChoiceContent(refined)).toEqual([]);
  });

  it("accepts both the existing generation request and the refinement request", () => {
    expect(generateRequestSchema.safeParse({
      activityType: "multiple_choice",
      teacherText: "Create a quiz about the water cycle.",
    }).success).toBe(true);
    expect(generateRequestSchema.safeParse({
      mode: "refine",
      activityType: "multiple_choice",
      content: makeContent(),
      instruction: "Make question 3 harder.",
    }).success).toBe(true);
  });

  it("rejects content with invalid shape before running quality checks", () => {
    expect(validateMultipleChoiceContent({ type: "multiple_choice", questions: [] })).toEqual({
      success: false,
      problems: expect.any(Array),
    });
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

  it("accepts clear true/false statements", () => {
    expect(checkTrueFalseContent(makeTrueFalseContent())).toEqual([]);
  });

  it("reports an empty true/false statement", () => {
    const content = makeTrueFalseContent();
    content.statements[2].statement = "   ";

    expect(checkTrueFalseContent(content)).toContain("Statement 3 cannot be empty");
  });

  it("reports true/false text that is too long", () => {
    const content = makeTrueFalseContent();
    content.statements[1].statement = "S".repeat(181);

    expect(checkTrueFalseContent(content)).toContain("Statement 2 is too long (maximum 180 characters)");
  });

  it("reports true/false quizzes outside the sensible count range", () => {
    expect(checkTrueFalseContent(makeTrueFalseContent(4))).toContain("A quiz must have between 5 and 15 statements");
    expect(checkTrueFalseContent(makeTrueFalseContent(16))).toContain("A quiz must have between 5 and 15 statements");
  });

  it("validates true/false content against its schema and checks", () => {
    expect(validateTrueFalseContent(makeTrueFalseContent())).toEqual({
      success: true,
      data: makeTrueFalseContent(),
    });
  });
});

function makeFlashcardsContent(cardCount = 5): FlashcardsContent {
  return {
    type: "flashcards",
    title: "Plant parts",
    instructions: "Flip each card, then say whether you knew it.",
    cards: Array.from({ length: cardCount }, (_, index) => ({
      front: `Term ${index + 1}`,
      back: `Definition ${index + 1}`,
    })),
  };
}

describe("checkFlashcardsContent", () => {
  it("accepts a clear deck", () => {
    expect(checkFlashcardsContent(makeFlashcardsContent())).toEqual([]);
  });

  it("keeps the sample deck valid", () => {
    expect(validateFlashcardsContent(sampleFlashcards).success).toBe(true);
  });

  it("reports an empty front or back", () => {
    const content = makeFlashcardsContent();
    content.cards[0].front = "  ";
    content.cards[1].back = "";

    const problems = checkFlashcardsContent(content);
    expect(problems).toContain("Card 1 needs text on the front");
    expect(problems).toContain("Card 2 needs text on the back");
  });

  it("reports duplicate fronts ignoring case and spaces", () => {
    const content = makeFlashcardsContent();
    content.cards[3].front = " term 1 ";

    expect(checkFlashcardsContent(content)).toContain("Card 4 has the same front as an earlier card");
  });

  it("reports text that is too long for a phone", () => {
    const content = makeFlashcardsContent();
    content.cards[0].front = "F".repeat(121);
    content.cards[1].back = "B".repeat(251);

    const problems = checkFlashcardsContent(content);
    expect(problems).toContain("Card 1 has a front that is too long (maximum 120 characters)");
    expect(problems).toContain("Card 2 has a back that is too long (maximum 250 characters)");
  });

  it("reports decks outside the sensible size range", () => {
    expect(checkFlashcardsContent(makeFlashcardsContent(4))).toContain("A deck must have between 5 and 20 cards");
    expect(checkFlashcardsContent(makeFlashcardsContent(21))).toContain("A deck must have between 5 and 20 cards");
  });
});

function makeMatchingContent(pairCount = 5): MatchingContent {
  return {
    type: "matching",
    title: "Plant parts",
    instructions: "Tap a term, then its partner.",
    pairs: Array.from({ length: pairCount }, (_, index) => ({
      left: `Term ${index + 1}`,
      right: `Partner ${index + 1}`,
    })),
  };
}

describe("checkMatchingContent", () => {
  it("accepts a clear set of pairs", () => {
    expect(checkMatchingContent(makeMatchingContent())).toEqual([]);
  });

  it("keeps the sample matching game valid", () => {
    expect(validateMatchingContent(sampleMatching).success).toBe(true);
  });

  it("reports an empty term or partner", () => {
    const content = makeMatchingContent();
    content.pairs[0].left = "  ";
    content.pairs[1].right = "";

    const problems = checkMatchingContent(content);
    expect(problems).toContain("Pair 1 needs a term");
    expect(problems).toContain("Pair 2 needs a partner");
  });

  it("reports repeated terms and repeated partners", () => {
    const content = makeMatchingContent();
    content.pairs[2].left = " term 1 ";
    content.pairs[3].right = "PARTNER 2";

    const problems = checkMatchingContent(content);
    expect(problems).toContain("Pair 3 has the same term as an earlier pair");
    expect(problems).toContain("Pair 4 has the same partner as an earlier pair");
  });

  it("reports text that is too long for a phone", () => {
    const content = makeMatchingContent();
    content.pairs[0].left = "L".repeat(61);
    content.pairs[1].right = "R".repeat(121);

    const problems = checkMatchingContent(content);
    expect(problems).toContain("Pair 1 has a term that is too long (maximum 60 characters)");
    expect(problems).toContain("Pair 2 has a partner that is too long (maximum 120 characters)");
  });

  it("reports games outside the sensible size range", () => {
    expect(checkMatchingContent(makeMatchingContent(3))).toContain("A matching game must have between 4 and 10 pairs");
    expect(checkMatchingContent(makeMatchingContent(11))).toContain("A matching game must have between 4 and 10 pairs");
  });
});