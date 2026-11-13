// Deletes a saved activity, but only after the teacher confirms.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { deleteActivity } from "../../app/dashboard/preview/actions";

export function DeleteActivityButton({ activityId }: { activityId: string }) {
  const router = useRouter();
  const [confirming, setConfirming] = useState(false);
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleDelete() {
    setPending(true);
    setError("");
    try {
      const result = await deleteActivity(activityId);
      if ("error" in result) {
        setError(typeof result.error === "string" ? result.error : "We couldn't delete this activity.");
        return;
      }
      router.push("/dashboard");
      router.refresh();
    } catch {
      setError("We couldn't delete this activity. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (!confirming) {
    return (
      <button
        className="mt-6 min-h-12 rounded-md border border-[#e0b9b5] px-5 text-sm font-semibold text-[#a3332d] transition hover:bg-[#fbeeec] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#a3332d]"
        onClick={() => setConfirming(true)}
        type="button"
      >
        Delete activity
      </button>
    );
  }

  return (
    <div className="mt-6 rounded-md bg-[#fbeeec] p-4" role="alertdialog" aria-label="Confirm delete">
      <p className="text-sm font-semibold text-[#a3332d]">Delete this activity?</p>
      <p className="mt-1 text-sm text-[#657067]">This can&apos;t be undone, and its share link will stop working.</p>
      {error && <p className="mt-2 text-sm text-[#a3332d]" role="alert">{error}</p>}
      <div className="mt-3 flex gap-3">
        <button
          className="min-h-12 rounded-md bg-[#a3332d] px-5 text-sm font-semibold text-white disabled:opacity-50"
          disabled={pending}
          onClick={handleDelete}
          type="button"
        >
          {pending ? "Deleting..." : "Yes, delete it"}
        </button>
        <button
          className="min-h-12 rounded-md border border-[#cbd4cb] bg-white px-5 text-sm font-semibold text-[#294337]"
          disabled={pending}
          onClick={() => setConfirming(false)}
          type="button"
        >
          Keep it
        </button>
      </div>
    </div>
  );
}