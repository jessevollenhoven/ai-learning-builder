// Previews, refines, and saves validated multiple-choice activities.
"use client";

import { useEffect, useState, useSyncExternalStore, type FormEvent } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { saveActivity } from "../../app/dashboard/preview/actions";
import { activityDraftStorageKey } from "../../lib/activity-utils";
import { validateMultipleChoiceContent } from "../../lib/checks";
import type { MultipleChoiceContent } from "../../lib/schemas";

type QuizPreviewProps = {
  initialContent?: MultipleChoiceContent;
  isSaved?: boolean;
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
    return validateMultipleChoiceContent(JSON.parse(snapshot));
  } catch {
    return { success: false as const, problems: [] };
  }
}

export function QuizPreview({ initialContent, isSaved = false }: QuizPreviewProps) {
  const router = useRouter();
  const draftSnapshot = useSyncExternalStore(subscribeToDraft, getDraftSnapshot, getServerDraftSnapshot);
  const draftValidation = validateDraftSnapshot(draftSnapshot);
  const [contentOverride, setContentOverride] = useState<MultipleChoiceContent | null>(null);
  const content = contentOverride ?? initialContent ?? (draftValidation?.success ? draftValidation.data : null);
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answerChecked, setAnswerChecked] = useState(false);
  const [instruction, setInstruction] = useState("");
  const [refining, setRefining] = useState(false);
  const [refineError, setRefineError] = useState("");
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");
  const loadError = !initialContent && draftSnapshot !== null && !draftValidation?.success;
  const question = content?.questions[questionIndex];

  useEffect(() => {
    if (!initialContent && draftSnapshot === null) router.replace("/dashboard/new");
  }, [initialContent, draftSnapshot, router]);

  function resetQuiz() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
    setAnswerChecked(false);
  }

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
          activityType: "multiple_choice",
          content,
          instruction,
        }),
      });
      const result: unknown = await response.json();

      if (!response.ok) {
        setRefineError(responseError(result) ?? "We couldn't refine this activity. Your current version is unchanged.");
        return;
      }

      const validation = validateMultipleChoiceContent(result);
      if (!validation.success) {
        setRefineError("The updated activity did not pass its checks. Your current version is unchanged.");
        return;
      }

      if (!isSaved) {
        sessionStorage.setItem(activityDraftStorageKey, JSON.stringify(validation.data));
      }
      setContentOverride(validation.data);
      setInstruction("");
      resetQuiz();
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

  function checkAnswer() {
    if (selectedAnswer === null || answerChecked || !question) return;
    if (selectedAnswer === question.correctIndex) setScore((currentScore) => currentScore + 1);
    setAnswerChecked(true);
  }

  function continueQuiz() {
    if (!answerChecked || !content) return;
    if (questionIndex === content.questions.length - 1) {
      setFinished(true);
      return;
    }
    setQuestionIndex(questionIndex + 1);
    setSelectedAnswer(null);
    setAnswerChecked(false);
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
        <section className="mt-7 border-t-2 border-[#183d31] bg-white p-5 shadow-[0_12px_36px_rgba(27,42,32,0.06)] sm:p-8">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase text-[#527264]">Multiple choice preview</p>
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

          {finished ? (
            <div className="py-8 text-center">
              <p className="text-sm font-semibold text-[#527264]">Quiz complete</p>
              <p className="mt-3 text-5xl font-semibold text-[#183d31]">
                {score}<span className="text-2xl text-[#657067]"> / {content.questions.length}</span>
              </p>
              <button
                className="mt-7 min-h-14 w-full rounded-md border border-[#cbd4cb] px-5 text-base font-semibold text-[#294337] hover:bg-[#edf1ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] sm:w-auto sm:min-w-48"
                onClick={resetQuiz}
                type="button"
              >
                Try again
              </button>
            </div>
          ) : question ? (
            <>
              <p className="mt-7 text-sm font-medium text-[#657067]">
                Question {questionIndex + 1} of {content.questions.length}
              </p>
              <h2 className="mt-4 text-xl font-semibold leading-7 sm:text-2xl">{question.question}</h2>
              <div className="mt-6 grid gap-3">
                {question.options.map((option, index) => (
                  <button
                    aria-pressed={selectedAnswer === index}
                    className={`min-h-14 rounded-md border px-4 py-3 text-left text-base transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] ${
                      selectedAnswer === index
                        ? "border-[#183d31] bg-[#e8eee8] font-semibold text-[#183d31]"
                        : "border-[#d8ded7] bg-white hover:border-[#8da596]"
                    }`}
                    disabled={answerChecked}
                    key={option}
                    onClick={() => setSelectedAnswer(index)}
                    type="button"
                  >
                    {option}
                  </button>
                ))}
              </div>
              {answerChecked && (
                <p className="mt-4 rounded-md bg-[#edf1ea] p-4 text-sm leading-6 text-[#294337]" role="status">
                  {selectedAnswer === question.correctIndex ? "Correct. " : "Not quite. "}
                  {question.explanation}
                </p>
              )}
              <button
                className="mt-6 min-h-14 w-full rounded-md bg-[#183d31] px-5 text-base font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:min-w-48"
                disabled={selectedAnswer === null && !answerChecked}
                onClick={answerChecked ? continueQuiz : checkAnswer}
                type="button"
              >
                {answerChecked
                  ? questionIndex === content.questions.length - 1 ? "Finish quiz" : "Next question"
                  : "Check answer"}
              </button>
            </>
          ) : null}

          <form className="mt-8 border-t border-[#e1e5de] pt-6" onSubmit={handleRefine}>
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
        </section>
      )}
    </main>
  );
}