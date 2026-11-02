// Shows the teacher's sample activities and entry point for creating one.
import Link from "next/link";
import { sampleActivities } from "../../lib/sample-data";

export default function DashboardPage() {
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
        <div className="divide-y divide-[#e1e5de] border-y border-[#cbd4cb] bg-white">
          {sampleActivities.map((activity) => (
            <article
              key={activity.title}
              className="flex flex-col gap-2 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5"
            >
              <h3 className="font-semibold">{activity.title}</h3>
              <div className="flex items-center justify-between gap-4 text-sm text-[#657067] sm:justify-end">
                <span>{activity.type}</span>
                <time className="min-w-24 text-right" dateTime={activity.date}>{activity.dateLabel}</time>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}