// Lists the signed-in teacher's saved activities through Supabase RLS.
import Link from "next/link";
import { createClient } from "../../lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: activities, error } = await supabase
    .from("activities")
    .select("id, type, title, created_at")
    .order("created_at", { ascending: false });

  return (
    <main className="mx-auto max-w-6xl px-4 py-8 sm:px-8 sm:py-12">
      <div className="flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-xs font-bold uppercase text-[#527264]">Teacher workspace</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">Your activities</h1>
          <p className="mt-2 text-sm text-[#657067]">A home for the learning you create.</p>
        </div>
        <Link
          className="inline-flex min-h-12 items-center justify-center rounded-md bg-[#183d31] px-5 text-sm font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31]"
          href="/dashboard/new"
        >
          New activity
        </Link>
      </div>
      <section aria-labelledby="activity-list-title" className="mt-9">
        <h2 id="activity-list-title" className="sr-only">Recent activities</h2>
        {error ? (
          <p className="border-y border-[#cbd4cb] bg-white p-5 text-sm text-[#a3332d]" role="alert">
            We couldn&apos;t load your activities. Please refresh the page.
          </p>
        ) : activities?.length ? (
          <div className="divide-y divide-[#e1e5de] border-y border-[#cbd4cb] bg-white">
            {activities.map((activity) => (
              <Link
                className="flex min-h-16 flex-col justify-center gap-2 px-4 py-4 transition hover:bg-[#f8f9f6] focus-visible:outline-2 focus-visible:outline-inset focus-visible:outline-[#183d31] sm:flex-row sm:items-center sm:justify-between sm:px-5"
                href={`/dashboard/preview?id=${encodeURIComponent(activity.id)}`}
                key={activity.id}
              >
                <span className="font-semibold">{activity.title}</span>
                <span className="flex items-center justify-between gap-4 text-sm text-[#657067] sm:justify-end">
                  <span>{activity.type}</span>
                  <time className="min-w-28 text-right" dateTime={activity.created_at}>
                    {new Date(activity.created_at).toLocaleDateString("en", {
                      year: "numeric",
                      month: "short",
                      day: "numeric",
                      timeZone: "UTC",
                    })}
                  </time>
                </span>
              </Link>
            ))}
          </div>
        ) : (
          <p className="border-y border-[#cbd4cb] bg-white p-5 text-sm text-[#657067]">
            No activities yet. Create one to get started.
          </p>
        )}
      </section>
    </main>
  );
}