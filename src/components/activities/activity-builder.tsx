// Submits activity requests and hands validated drafts to the preview.
"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { activityTypes, type ActivityType } from "../../lib/sample-data";
import { activityDraftStorageKey } from "../../lib/activity-utils";
import { validateMultipleChoiceContent } from "../../lib/checks";

export function ActivityBuilder() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<ActivityType>(activityTypes[0]);
  const [notes, setNotes] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function generateActivity() {
    setPending(true);
    setError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ activityType: "multiple_choice", teacherText: notes }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        const message =
          typeof result === "object" && result !== null && "error" in result && typeof result.error === "string"
            ? result.error
            : "We couldn't generate this activity. Please try again.";
        setError(message);
        return;
      }

      const validation = validateMultipleChoiceContent(result);
      if (!validation.success) {
        setError("The activity preview wasn't valid. Please try again.");
        return;
      }

      sessionStorage.setItem(activityDraftStorageKey, JSON.stringify(validation.data));
      router.push("/dashboard/preview");
    } catch {
      setError("We couldn't reach the activity service. Check your connection and try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-[#285c43] hover:underline" href="/dashboard">
        <span aria-hidden="true" className="mr-2">←</span>All activities
      </Link>
      <p className="mt-7 text-xs font-bold uppercase text-[#527264]">New activity</p>
      <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">What are we learning?</h1>
      <p className="mt-2 text-sm leading-6 text-[#657067]">Choose a format, then add a topic or class notes.</p>

      <fieldset className="mt-8">
        <legend className="text-sm font-semibold">Activity type</legend>
        <p className="mt-1 text-xs text-[#818a81]">Multiple choice is available now. Other formats are coming later.</p>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activityTypes.map((type) => {
            const selected = type === selectedType;
            return (
              <button
                aria-pressed={selected}
                className={`min-h-14 rounded-md border px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] ${
                  selected
                    ? "border-[#183d31] bg-[#e8eee8] text-[#183d31]"
                    : "border-[#d8ded7] bg-white hover:border-[#8da596] disabled:cursor-not-allowed disabled:opacity-45"
                }`}
                key={type}
                disabled={type !== activityTypes[0]}
                onClick={() => setSelectedType(type)}
                type="button"
              >
                {type}
              </button>
            );
          })}
        </div>
      </fieldset>

      <label className="mt-8 block text-sm font-semibold" htmlFor="activity-notes">
        Describe the activity or paste your notes
        <textarea
          className="mt-3 min-h-40 w-full resize-y rounded-md border border-[#d8ded7] bg-white p-4 text-base font-normal leading-6 outline-none transition placeholder:text-[#89928a] focus:border-[#527264] focus:ring-2 focus:ring-[#527264]/15"
          id="activity-notes"
          onChange={(event) => setNotes(event.target.value)}
          placeholder="For example: Help students understand how water moves through the environment..."
          value={notes}
        />
      </label>
      <p className="mt-2 text-xs text-[#818a81]">Your notes are used to make the preview. Nothing is saved until you choose Save.</p>

      {error && <p className="mt-4 text-sm text-[#a3332d]" role="alert">{error}</p>}
      <button
        className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-md bg-[#183d31] px-5 text-base font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto sm:min-w-48"
        disabled={pending || !notes.trim() || selectedType !== activityTypes[0]}
        onClick={generateActivity}
        type="button"
      >
        {pending ? "Generating..." : "Generate"}
      </button>
    </div>
  );
}