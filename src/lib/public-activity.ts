// Exposes only shared multiple-choice content that passes validation.
import { validateMultipleChoiceContent } from "./checks";
import type { MultipleChoiceContent } from "./schemas";

type PublicActivityRow = {
  type: string;
  shared: boolean;
  content: unknown;
};

export function getPublicActivityContent(
  activity: PublicActivityRow | null,
): MultipleChoiceContent | null {
  if (!activity || !activity.shared || activity.type !== "multiple_choice") return null;

  const validation = validateMultipleChoiceContent(activity.content);
  return validation.success ? validation.data : null;
}