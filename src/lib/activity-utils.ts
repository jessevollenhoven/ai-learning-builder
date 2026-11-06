// Defines the browser draft key and narrow activity database payloads.
import type { ActivityContent } from "./schemas";

export const activityDraftStorageKey = "ai-learning-builder:activity-draft";

export function buildActivityInsert(content: ActivityContent) {
  return {
    type: content.type,
    title: content.title,
    content,
  };
}

export function buildActivityShareUpdate(shared: boolean) {
  return { shared };
}