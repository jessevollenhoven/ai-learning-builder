// Serves a shared quiz publicly without loading owner-only actions.
import { QuizPlayer } from "../../../components/activities/quiz-player";
import { getPublicActivityContent } from "../../../lib/public-activity";
import { createClient } from "../../../lib/supabase/server";

type PublicActivityPageProps = {
  params: Promise<{ id: string }>;
};

export default async function PublicActivityPage({ params }: PublicActivityPageProps) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: activity, error } = await supabase
    .from("activities")
    .select("type, shared, content")
    .eq("id", id)
    .eq("shared", true)
    .maybeSingle();
  const content = error ? null : getPublicActivityContent(activity);

  return (
    <main className="min-h-screen bg-[#f4f4ef] px-4 py-8 text-[#20251f] sm:py-12">
      <div className="mx-auto max-w-3xl">
        <p className="text-sm font-semibold text-[#294337]">Lesson Foundry</p>
        {content ? (
          <QuizPlayer content={content} />
        ) : (
          <section className="mt-7 border-t-2 border-[#183d31] bg-white p-6 shadow-[0_12px_36px_rgba(27,42,32,0.06)] sm:p-8">
            <h1 className="text-2xl font-semibold">This activity isn&apos;t available</h1>
            <p className="mt-2 text-sm leading-6 text-[#657067]">
              It may have been removed or sharing may have been turned off.
            </p>
          </section>
        )}
      </div>
    </main>
  );
}