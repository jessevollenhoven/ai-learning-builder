// Lets teachers choose an activity type and enter notes for the prototype.
"use client";

import { useState } from "react";
import Link from "next/link";
import { activityTypes, type ActivityType } from "../../lib/sample-data";

export function ActivityBuilder() {
  const [selectedType, setSelectedType] = useState<ActivityType>(activityTypes[0]);
  const [notes, setNotes] = useState("");

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
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-3">
          {activityTypes.map((type) => {
            const selected = type === selectedType;
            return (
              <button
                aria-pressed={selected}
                className={`min-h-14 rounded-md border px-3 py-3 text-left text-sm font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] ${
                  selected
                    ? "border-[#183d31] bg-[#e8eee8] text-[#183d31]"
                    : "border-[#d8ded7] bg-white hover:border-[#8da596]"
                }`}
                key={type}
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
      <p className="mt-2 text-xs text-[#818a81]">Your notes stay in this browser prototype and are not saved.</p>

      <Link
        className="mt-7 inline-flex min-h-14 w-full items-center justify-center rounded-md bg-[#183d31] px-5 text-base font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] sm:w-auto sm:min-w-48"
        href="/dashboard/preview"
      >
        Generate
      </Link>
    </div>
  );
}