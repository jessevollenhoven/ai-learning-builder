// Previews, refines, and saves validated multiple-choice activities.
"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveActivity } from "../../app/dashboard/preview/actions";
import { activityDraftStorageKey } from "../../lib/activity-utils";
import { activityTypes, validateActivityContent } from "../../lib/activity-types";import type { ActivityContent } from "../../lib/schemas";
import { ActivityShareControls } from "./activity-share-controls";
import { QuizPlayer } from "./quiz-player";

type QuizPreviewProps = {
  initialContent?: ActivityContent;
  isSaved?: boolean;
  activityId?: string;
  isShared?: boolean;
};

function responseError(value: unknown): string | undefined {
  if (typeof value === "object" && value !== null && "error" in value && typeof value.error === "string") {
    return value.error;
  }
  return undefined;
}

function subscribeToDraft(onStoreChange: () => void) {
  if (typeof window === "undefined") return () => {};
  window.addEventListener("storage", onStoreChange);
  return () => window.removeEventListener("storage", onStoreChange);
}

function getDraftSnapshot() {
  try {
    return typeof window === "undefined" ? null : window.sessionStorage.getItem(activityDraftStorageKey);
  } catch {
    return null;
  }
}

function getServerDraftSnapshot() {
  return null;
}

function validateDraftSnapshot(snapshot: string | null) {
  if (!snapshot) return null;
  try {
    return validateActivityContent(JSON.parse(snapshot));
  } catch {
    return { success: false as const, problems: [] };
  }
}

export function QuizPreview({ initialContent, isSaved = false, activityId, isShared = false }: QuizPreviewProps) {
  const router = useRouter();
  const draftSnapshot = useSyncExternalStore(subscribeToDraft, getDraftSnapshot, getServerDraftSnapshot);
  const draftValidation = validateDraftSnapshot(draftSnapshot);
  const [contentOverride, setContentOverride] = useState<ActivityContent | null>(null);
  const [playerVersion, setPlayerVersion] = useState(0);
  const content = contentOverride ?? initialContent ?? (draftValidation?.success ? draftValidation.data : null);
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const loadError = !initialContent && draftSnapshot !== null && !draftValidation?.success;

  useEffect(() => {
    if (!initialContent && draftSnapshot === null) router.replace("/dashboard/new");
  }, [initialContent, draftSnapshot, router]);

  async function handleRefine(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!content) return;

    setRefining(true);
    setRefineError("");

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: "refine",
          activityType: content.type,
          content,
          instruction,
        }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        setRefineError(responseError(result) ?? "We couldn't refine this activity. Your current version is unchanged.");
        return;
      }

      const validation = validateActivityContent(result);
      if (!validation.success) {
        setRefineError("The updated activity did not pass its checks. Your current version is unchanged.");
        return;
      }

      if (!isSaved) {
        sessionStorage.setItem(activityDraftStorageKey, JSON.stringify(validation.data));
      }
      setContentOverride(validation.data);
      setPlayerVersion((version) => version + 1);
      setInstruction("");
    } catch {
      setRefineError("We couldn't reach the activity service. Your current version is unchanged.");
    } finally {
      setRefining(false);
    }
  }

  async function handleSave() {
    if (!content) return;

    setSaving(true);
    setSaveError("");
    try {
      const result = await saveActivity(content);
      if ("error" in result) {
        if (typeof result.error === "string") {
          setSaveError(result.error);
        }
        return;
      }

      sessionStorage.removeItem(activityDraftStorageKey);
      router.push("/dashboard");
      router.refresh();
    } catch {
      setSaveError("We couldn't save this activity. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-[#285c43] hover:underline" href="/dashboard">
        <span aria-hidden="true" className="mr-2">←</span>Dashboard
      </Link>

      {loadError ? (
        <p className="mt-7 rounded-md bg-white p-5 text-sm text-[#a3332d]" role="alert">
          This preview could not be loaded. Please generate it again.
        </p>
      ) : !content ? (
        <p className="mt-7 rounded-md bg-white p-5 text-sm text-[#657067]" role="status">Loading preview...</p>
      ) : (
        <div className="mt-7">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#527264]">{activityTypes[content.type].label} preview</p>
              <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{content.title}</h1>
              <p className="mt-2 text-sm leading-6 text-[#657067]">{content.instructions}</p>
            </div>
            <button
              className="min-h-12 shrink-0 rounded-md bg-[#183d31] px-5 text-sm font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-wait disabled:opacity-50"
              disabled={saving}
              onClick={handleSave}
              type="button"
            >
              {saving ? "Saving..." : isSaved ? "Save a copy" : "Save activity"}
            </button>
          </div>
          {saveError && <p className="mt-3 text-sm text-[#a3332d]" role="alert">{saveError}</p>}
          {isSaved && activityId && (
            <ActivityShareControls activityId={activityId} initialShared={isShared} />
          )}
          <QuizPlayer key={playerVersion} content={content} />

          <form className="mt-7 border-y border-[#cbd4cb] bg-white p-5" onSubmit={handleRefine}>
            <label className="block text-sm font-semibold" htmlFor="refine-instruction">
              Refine this activity
              <textarea
                className="mt-2 min-h-24 w-full rounded-md border border-[#d8ded7] bg-white p-3 text-base font-normal leading-6 outline-none focus:border-[#527264] focus:ring-2 focus:ring-[#527264]/15"
                id="refine-instruction"
                onChange={(event) => setInstruction(event.target.value)}
                placeholder="For example: make question 3 harder"
                value={instruction}
              />
            </label>
            {refineError && <p className="mt-3 text-sm text-[#a3332d]" role="alert">{refineError}</p>}
            <button
              className="mt-3 min-h-12 rounded-md border border-[#cbd4cb] px-5 text-sm font-semibold text-[#294337] transition hover:bg-[#edf1ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-not-allowed disabled:opacity-50"
              disabled={refining || !instruction.trim()}
              type="submit"
            >
              {refining ? "Refining..." : "Refine"}
            </button>
          </form>
        </div>
      )}
    </main>
  );
}