// Registers implemented activity schemas, checks, prompts, samples, and players.
import type { ComponentType } from "react";
import { checkFlashcardsContent, checkMatchingContent, checkMultipleChoiceContent, checkTrueFalseContent } from "./checks";
import { sampleFlashcards, sampleMatching, sampleQuiz, sampleTrueFalseQuiz } from "./sample-data";
import {
  activityContentSchema,
  flashcardsContentSchema,
  multipleChoiceContentSchema,
  trueFalseContentSchema,
  matchingContentSchema,
  type ActivityContent,
  type ActivityTypeId,
} from "./schemas";
import { MultipleChoicePlayer } from "../components/activities/multiple-choice-player";
import type { ActivityPlayerProps } from "../components/activities/player-types";
import { TrueFalsePlayer } from "../components/activities/true-false-player";

type ActivityTypeDefinition = {
  label: string;
  enabled: boolean;
    schema:
    | typeof multipleChoiceContentSchema
    | typeof trueFalseContentSchema
    | typeof flashcardsContentSchema
    | typeof matchingContentSchema
    | null;
  checks: ((content: ActivityContent) => string[]) | null;
  systemPrompt: string | null;
  sample: ActivityContent | null;
  player: ComponentType<ActivityPlayerProps> | null;
  getQuestion: ((content: ActivityContent, index: number) => ActivityQuestionData) | null;
};

export type ActivityQuestionData = {
  prompt: string;
  options?: string[];
  correctAnswer: number | boolean;
  explanation: string;
};

function checkMultipleChoice(content: ActivityContent): string[] {
  return content.type === "multiple_choice"
    ? checkMultipleChoiceContent(content)
    : ["The content type does not match the multiple-choice activity"];
}

function checkTrueFalse(content: ActivityContent): string[] {
  return content.type === "true_false"
    ? checkTrueFalseContent(content)
    : ["The content type does not match the true/false activity"];
}

function getMultipleChoiceQuestion(content: ActivityContent, index: number): ActivityQuestionData {
  if (content.type !== "multiple_choice") throw new Error("Activity type mismatch");
  const question = content.questions[index];
  return {
    prompt: question.question,
    options: question.options,
    correctAnswer: question.correctIndex,
    explanation: question.explanation,
  };
}

function getTrueFalseQuestion(content: ActivityContent, index: number): ActivityQuestionData {
  if (content.type !== "true_false") throw new Error("Activity type mismatch");
  const statement = content.statements[index];
  return {
    prompt: statement.statement,
    correctAnswer: statement.answer,
    explanation: statement.explanation,
  };
}

function checkFlashcards(content: ActivityContent): string[] {
  return content.type === "flashcards"
    ? checkFlashcardsContent(content)
    : ["The content type does not match the flashcards activity"];
}

function checkMatching(content: ActivityContent): string[] {
  return content.type === "matching"
    ? checkMatchingContent(content)
    : ["The content type does not match the matching activity"];
}

export const activityTypes: Record<ActivityTypeId, ActivityTypeDefinition> = {
  multiple_choice: {
    label: "Multiple choice",
    enabled: true,
    schema: multipleChoiceContentSchema,
    checks: checkMultipleChoice,
    systemPrompt: "Create a multiple-choice quiz with exactly four distinct options and one correct answer per question.",
    sample: sampleQuiz,
    player: MultipleChoicePlayer,
    getQuestion: getMultipleChoiceQuestion,
  },
  true_false: {
    label: "True / false",
    enabled: true,
    schema: trueFalseContentSchema,
    checks: checkTrueFalse,
    systemPrompt: "Create a true/false quiz with clear factual statements and one correct boolean answer per statement.",
    sample: sampleTrueFalseQuiz,
    player: TrueFalsePlayer,
    getQuestion: getTrueFalseQuestion,
  },
    // Flashcards use their own player (flashcards-player.tsx), so no per-question player is needed.
  flashcards: {
    label: "Flashcards",
    enabled: true,
    schema: flashcardsContentSchema,
    checks: checkFlashcards,
    systemPrompt: "Create a deck of flashcards, each with a short front (a term or question) and a clear back (the answer or definition).",
    sample: sampleFlashcards,
    player: null,
    getQuestion: null,
  },
    // Matching uses its own player (matching-player.tsx), like flashcards.
  matching: {
    label: "Matching",
    enabled: true,
    schema: matchingContentSchema,
    checks: checkMatching,
    systemPrompt: "Create matching pairs, each with a short term and a partner such as its definition.",
    sample: sampleMatching,
    player: null,
    getQuestion: null,
  },
  ordering: { label: "Ordering", enabled: false, schema: null, checks: null, systemPrompt: null, sample: null, player: null, getQuestion: null },
};

export const activityTypeOptions = (Object.keys(activityTypes) as ActivityTypeId[]).map((type) => ({
  type,
  label: activityTypes[type].label,
  enabled: activityTypes[type].enabled,
}));

export function getActivityType(type: string): ActivityTypeDefinition | undefined {
  return Object.hasOwn(activityTypes, type) ? activityTypes[type as ActivityTypeId] : undefined;
}

export function validateActivityContent(input: unknown):
  | { success: true; data: ActivityContent }
  | { success: false; problems: string[] } {
  const parsed = activityContentSchema.safeParse(input);
  if (!parsed.success) {
    return { success: false, problems: parsed.error.issues.map((issue) => issue.message) };
  }
  const definition = activityTypes[parsed.data.type];
  const problems = definition.checks?.(parsed.data) ?? ["This activity type is not enabled"];
  return problems.length > 0 ? { success: false, problems } : { success: true, data: parsed.data };
}