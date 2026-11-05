// Lets an owner toggle sharing and copy the public activity URL.
"use client";

import { useState } from "react";
import { setActivityShared } from "../../app/dashboard/preview/actions";

type ActivityShareControlsProps = {
  activityId: string;
  initialShared: boolean;
};

export function ActivityShareControls({ activityId, initialShared }: ActivityShareControlsProps) {
  const [shared, setShared] = useState(initialShared);
  const [pending, setPending] = useState(false);
  const [message, setMessage] = useState("");

  async function toggleSharing() {
    setPending(true);
    setMessage("");

    try {
      const result = await setActivityShared(activityId, !shared);
      if ("error" in result) {
        setMessage(typeof result.error === "string" ? result.error : "We couldn't update sharing.");
        return;
      }
      setShared(!shared);
    } catch {
      setMessage("We couldn't update sharing. Please try again.");
    } finally {
      setPending(false);
    }
  }

  async function copyLink() {
    setMessage("");
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/a/${encodeURIComponent(activityId)}`);
      setMessage("Link copied.");
    } catch {
      setMessage("Couldn't copy the link. Select and copy it instead.");
    }
  }

  return (
    <section className="mt-6 border-y border-[#cbd4cb] py-5" aria-label="Share activity">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-semibold">Share activity</p>
          <p className="mt-1 text-sm text-[#657067]">
            {shared ? "Anyone with the link can play this activity." : "Only you can access this activity."}
          </p>
        </div>
        <button
          aria-pressed={shared}
          className="min-h-12 rounded-md border border-[#cbd4cb] px-5 text-sm font-semibold text-[#294337] transition hover:bg-[#edf1ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-wait disabled:opacity-50"
          disabled={pending}
          onClick={toggleSharing}
          type="button"
        >
          {pending ? "Updating..." : shared ? "Turn sharing off" : "Turn sharing on"}
        </button>
      </div>
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        <code className="min-h-11 flex-1 break-all rounded-md bg-white px-3 py-3 text-sm text-[#294337]">/a/{activityId}</code>
        <button
          className="min-h-12 rounded-md bg-[#183d31] px-5 text-sm font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-not-allowed disabled:opacity-45"
          disabled={!shared}
          onClick={copyLink}
          type="button"
        >
          Copy link
        </button>
      </div>
      {message && <p className="mt-3 text-sm text-[#657067]" role="status">{message}</p>}
    </section>
  );
}