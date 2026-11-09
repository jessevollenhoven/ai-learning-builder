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

// Only these columns can change when an activity is edited. owner_id and type are never sent.
export function buildActivityUpdate(content: ActivityContent) {
  return {
    title: content.title,
    content,
    updated_at: new Date().toISOString(),
  };
}