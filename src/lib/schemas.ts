// Defines the validated request and multiple-choice activity contracts.
import { z } from "zod";

export const multipleChoiceQuestionSchema = z.object({
  question: z.string().trim().min(1),
  options: z.array(z.string().trim().min(1)).length(4),
  correctIndex: z.number().int().min(0).max(3),
  explanation: z.string().trim().min(1).max(500),
});

export const multipleChoiceContentSchema = z.object({
  type: z.literal("multiple_choice"),
  title: z.string().trim().min(1),
  instructions: z.string().trim().min(1),
  questions: z.array(multipleChoiceQuestionSchema).min(5).max(15),
});

export const trueFalseStatementSchema = z.object({
  statement: z.string().trim().min(1),
  answer: z.boolean(),
  explanation: z.string().trim().min(1).max(500),
});

export const trueFalseContentSchema = z.object({
  type: z.literal("true_false"),
  title: z.string().trim().min(1),
  instructions: z.string().trim().min(1),
  statements: z.array(trueFalseStatementSchema).min(5).max(15),
});

export const flashcardSchema = z.object({
  front: z.string().trim().min(1),
  back: z.string().trim().min(1),
});

export const flashcardsContentSchema = z.object({
  type: z.literal("flashcards"),
  title: z.string().trim().min(1),
  instructions: z.string().trim().min(1),
  cards: z.array(flashcardSchema).min(5).max(20),
});

export const matchingPairSchema = z.object({
  left: z.string().trim().min(1),
  right: z.string().trim().min(1),
});

export const matchingContentSchema = z.object({
  type: z.literal("matching"),
  title: z.string().trim().min(1),
  instructions: z.string().trim().min(1),
  pairs: z.array(matchingPairSchema).min(4).max(10),
});

export const orderingContentSchema = z.object({
  type: z.literal("ordering"),
  title: z.string().trim().min(1),
  instructions: z.string().trim().min(1),
  // The items are stored in the correct order. The player shuffles them.
  items: z.array(z.string().trim().min(1)).min(4).max(10),
});

export const activityContentSchema = z.discriminatedUnion("type", [
  multipleChoiceContentSchema,
  trueFalseContentSchema,
  flashcardsContentSchema,
  matchingContentSchema,
  orderingContentSchema,
  
]);

export type MultipleChoiceContent = z.infer<typeof multipleChoiceContentSchema>;
export type TrueFalseContent = z.infer<typeof trueFalseContentSchema>;
export type FlashcardsContent = z.infer<typeof flashcardsContentSchema>;
export type MatchingContent = z.infer<typeof matchingContentSchema>;
export type OrderingContent = z.infer<typeof orderingContentSchema>;
export type ActivityContent = z.infer<typeof activityContentSchema>;
export type ActivityTypeId = ActivityContent["type"];
export const activityTypeSchema = z.enum([
  "multiple_choice",
  "true_false",
  "flashcards",
  "matching",
  "ordering",
]);

export const initialGenerateRequestSchema = z.object({
  activityType: activityTypeSchema,
  teacherText: z.string().trim().min(1).max(5000),
});

export const refineRequestSchema = z.object({
  mode: z.literal("refine"),
  activityType: activityTypeSchema,
  content: activityContentSchema,
  instruction: z.string().trim().min(1).max(5000),
}).superRefine((request, context) => {
  if (request.activityType !== request.content.type) {
    context.addIssue({
      code: "custom",
      path: ["content", "type"],
      message: "The activity type must match the content type",
    });
  }
});

export const generateRequestSchema = z.union([
  initialGenerateRequestSchema,
  refineRequestSchema,
]);

export type GenerateRequest = z.infer<typeof generateRequestSchema>;