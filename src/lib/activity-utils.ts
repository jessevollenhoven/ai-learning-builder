// Defines the browser draft key and safe database insert shape.
import type { MultipleChoiceContent } from "./schemas";

export const activityDraftStorageKey = "ai-learning-builder:activity-draft";

export function buildActivityInsert(content: MultipleChoiceContent) {
  return {
    type: content.type,
    title: content.title,
    content,
  };
}