// Exposes only shared activity content that passes validation.
import { validateActivityContent } from "./activity-types";
import type { ActivityContent } from "./schemas";

type PublicActivityRow = {
  type: string;
  shared: boolean;
  content: unknown;
};

export function getPublicActivityContent(activity: PublicActivityRow | null): ActivityContent | null {
  if (!activity || !activity.shared) return null;

  const validation = validateActivityContent(activity.content);
  // The saved type must match the content, so mismatched rows are never shown.
  if (!validation.success || validation.data.type !== activity.type) return null;
  return validation.data;
}