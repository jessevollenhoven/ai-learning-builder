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

export type MultipleChoiceContent = z.infer<typeof multipleChoiceContentSchema>;

export const initialGenerateRequestSchema = z.object({
  activityType: z.literal("multiple_choice"),
  teacherText: z.string().trim().min(1).max(5000),
});

export const refineRequestSchema = z.object({
  mode: z.literal("refine"),
  activityType: z.literal("multiple_choice"),
  content: multipleChoiceContentSchema,
  instruction: z.string().trim().min(1).max(5000),
});

export const generateRequestSchema = z.union([
  initialGenerateRequestSchema,
  refineRequestSchema,
]);

export type GenerateRequest = z.infer<typeof generateRequestSchema>;