// Reports readability and duplicate-choice problems in validated activity content.
import type { MultipleChoiceContent } from "./schemas";

const textLimits = {
  title: 70,
  instructions: 180,
  question: 180,
  option: 75,
  explanation: 180,
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