// Reports readability and duplicate-choice problems in validated activity content.
import {
  flashcardsContentSchema,
  multipleChoiceContentSchema,
  trueFalseContentSchema,
  type FlashcardsContent,
  type MultipleChoiceContent,
  type TrueFalseContent,
} from "./schemas";

const textLimits = {
  title: 70,
  instructions: 180,
  question: 180,
  statement: 180,
  option: 75,
  explanation: 180,
  cardFront: 120,
  cardBack: 250,
} as const;

export function checkMultipleChoiceContent(content: MultipleChoiceContent): string[] {
  const problems: string[] = [];

  if (content.questions.length < 5 || content.questions.length > 15) {
    problems.push("A quiz must have between 5 and 15 questions");
  }
  if (content.title.length > textLimits.title) {
    problems.push(`The title must be ${textLimits.title} characters or fewer`);
  }
  if (content.instructions.length > textLimits.instructions) {
    problems.push(`Instructions must be ${textLimits.instructions} characters or fewer`);
  }

  content.questions.forEach((question, index) => {
    const number = index + 1;
    const normalizedOptions = question.options.map((option) => option.trim().toLocaleLowerCase());

    if (new Set(normalizedOptions).size !== normalizedOptions.length) {
      problems.push(`Question ${number} has two identical options`);
    }
    if (question.question.length > textLimits.question) {
      problems.push(`Question ${number} is too long (maximum ${textLimits.question} characters)`);
    }
    if (question.options.some((option) => option.length > textLimits.option)) {
      problems.push(`Question ${number} has an option that is too long (maximum ${textLimits.option} characters)`);
    }
    if (question.explanation.length > textLimits.explanation) {
      problems.push(`Question ${number} has an explanation that is too long (maximum ${textLimits.explanation} characters)`);
    }
  });

  return problems;
}

export function validateMultipleChoiceContent(input: unknown):
  | { success: true; data: MultipleChoiceContent }
  | { success: false; problems: string[] } {
  const parsed = multipleChoiceContentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, problems: parsed.error.issues.map((issue) => issue.message) };
  }

  const problems = checkMultipleChoiceContent(parsed.data);
  return problems.length > 0
    ? { success: false, problems }
    : { success: true, data: parsed.data };
}

export function checkTrueFalseContent(content: TrueFalseContent): string[] {
  const problems: string[] = [];

  if (content.statements.length < 5 || content.statements.length > 15) {
    problems.push("A quiz must have between 5 and 15 statements");
  }
  if (content.title.length > textLimits.title) {
    problems.push(`The title must be ${textLimits.title} characters or fewer`);
  }
  if (content.instructions.length > textLimits.instructions) {
    problems.push(`Instructions must be ${textLimits.instructions} characters or fewer`);
  }

  content.statements.forEach((item, index) => {
    const number = index + 1;
    if (!item.statement.trim()) {
      problems.push(`Statement ${number} cannot be empty`);
    }
    if (item.statement.length > textLimits.statement) {
      problems.push(`Statement ${number} is too long (maximum ${textLimits.statement} characters)`);
    }
    if (item.explanation.length > textLimits.explanation) {
      problems.push(`Statement ${number} has an explanation that is too long (maximum ${textLimits.explanation} characters)`);
    }
  });

  return problems;
}

export function validateTrueFalseContent(input: unknown):
  | { success: true; data: TrueFalseContent }
  | { success: false; problems: string[] } {
  const parsed = trueFalseContentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, problems: parsed.error.issues.map((issue) => issue.message) };
  }

  const problems = checkTrueFalseContent(parsed.data);
  return problems.length > 0
    ? { success: false, problems }
    : { success: true, data: parsed.data };
}

export function checkFlashcardsContent(content: FlashcardsContent): string[] {
  const problems: string[] = [];

  if (content.cards.length < 5 || content.cards.length > 20) {
    problems.push("A deck must have between 5 and 20 cards");
  }
  if (content.title.length > textLimits.title) {
    problems.push(`The title must be ${textLimits.title} characters or fewer`);
  }
  if (content.instructions.length > textLimits.instructions) {
    problems.push(`Instructions must be ${textLimits.instructions} characters or fewer`);
  }

  const seenFronts = new Set<string>();
  content.cards.forEach((card, index) => {
    const number = index + 1;
    const front = card.front.trim();

    if (!front) problems.push(`Card ${number} needs text on the front`);
    if (!card.back.trim()) problems.push(`Card ${number} needs text on the back`);
    if (card.front.length > textLimits.cardFront) {
      problems.push(`Card ${number} has a front that is too long (maximum ${textLimits.cardFront} characters)`);
    }
    if (card.back.length > textLimits.cardBack) {
      problems.push(`Card ${number} has a back that is too long (maximum ${textLimits.cardBack} characters)`);
    }

    const normalized = front.toLocaleLowerCase();
    if (normalized && seenFronts.has(normalized)) {
      problems.push(`Card ${number} has the same front as an earlier card`);
    }
    seenFronts.add(normalized);
  });

  return problems;
}

export function validateFlashcardsContent(input: unknown):
  | { success: true; data: FlashcardsContent }
  | { success: false; problems: string[] } {
  const parsed = flashcardsContentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, problems: parsed.error.issues.map((issue) => issue.message) };
  }

  const problems = checkFlashcardsContent(parsed.data);
  return problems.length > 0
    ? { success: false, problems }
    : { success: true, data: parsed.data };
}