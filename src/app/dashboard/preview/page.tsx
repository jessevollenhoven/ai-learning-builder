// Loads an RLS-scoped saved activity or hands a draft to the preview client.
import { notFound } from "next/navigation";
import { QuizPreview } from "../../../components/activities/quiz-preview";
import { validateActivityContent } from "../../../lib/activity-types";
import { createClient } from "../../../lib/supabase/server";

type ActivityPreviewPageProps = {
  searchParams: Promise<{ id?: string | string[] }>;
};

export default async function ActivityPreviewPage({ searchParams }: ActivityPreviewPageProps) {
  const { id } = await searchParams;
  if (!id) return <QuizPreview />;
  if (Array.isArray(id)) notFound();

  const supabase = await createClient();
  const { data: claimsData } = await supabase.auth.getClaims();
  const userId = claimsData?.claims?.sub;
  if (!userId) notFound();
  const { data: activity, error } = await supabase
    .from("activities")
    .select("id, type, content, shared")
    .eq("id", id)
    .eq("owner_id", userId)
    .maybeSingle();

  if (error || !activity) notFound();

  const validation = validateActivityContent(activity.content);
  if (!validation.success || validation.data.type !== activity.type) notFound();

  return (
    <QuizPreview
      initialContent={validation.data}
      isSaved
      activityId={activity.id}
      isShared={activity.shared}
    />
  );
}