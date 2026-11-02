// Runs a local sample multiple-choice quiz and reports the final score.
"use client";

import { useState } from "react";
import Link from "next/link";
import { sampleQuiz } from "../../lib/sample-data";

export function QuizPreview() {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const question = sampleQuiz.questions[questionIndex];

  function continueQuiz() {
    if (selectedAnswer === null) return;
    const nextScore = score + Number(selectedAnswer === question.answerIndex);
    setScore(nextScore);

    if (questionIndex === sampleQuiz.questions.length - 1) {
      setFinished(true);
      return;
    }

    setQuestionIndex(questionIndex + 1);
    setSelectedAnswer(null);
  }

  function restartQuiz() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
  }

  return (
    <main className="mx-auto max-w-3xl px-4 py-8 sm:px-8 sm:py-12">
      <Link className="inline-flex min-h-11 items-center text-sm font-semibold text-[#285c43] hover:underline" href="/dashboard">
        <span aria-hidden="true" className="mr-2">←</span>Dashboard
      </Link>
      <section className="mt-7 border-t-2 border-[#183d31] bg-white p-5 shadow-[0_12px_36px_rgba(27,42,32,0.06)] sm:p-8">
        <p className="text-xs font-bold uppercase text-[#527264]">Sample quiz</p>
        <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{sampleQuiz.title}</h1>

        {finished ? (
          <div className="py-8 text-center">
            <p className="text-sm font-semibold text-[#527264]">Quiz complete</p>
            <p className="mt-3 text-5xl font-semibold text-[#183d31]">{score}<span className="text-2xl text-[#657067]"> / {sampleQuiz.questions.length}</span></p>
            <p className="mt-3 text-sm text-[#657067]">{score === sampleQuiz.questions.length ? "Perfect score. Nicely done." : "Thanks for giving it a try."}</p>
            <button
              className="mt-7 min-h-14 w-full rounded-md bg-[#183d31] px-5 text-base font-semibold text-white hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] sm:w-auto sm:min-w-48"
              onClick={restartQuiz}
              type="button"
            >
              Try again
            </button>
          </div>
        ) : (
          <>
            <div className="mt-7 flex items-center justify-between gap-4">
              <p className="text-sm font-medium text-[#657067]">Question {questionIndex + 1} of {sampleQuiz.questions.length}</p>
              <div aria-label={`Question ${questionIndex + 1} of ${sampleQuiz.questions.length}`} className="flex gap-1.5">
                {sampleQuiz.questions.map((item, index) => (
                  <span
                    aria-hidden="true"
                    className={`h-1.5 w-7 rounded-full ${index <= questionIndex ? "bg-[#527264]" : "bg-[#dfe4dc]"}`}
                    key={item.prompt}
                  />
                ))}
              </div>
            </div>
            <h2 className="mt-5 text-xl font-semibold leading-7 sm:text-2xl">{question.prompt}</h2>
            <div className="mt-6 grid gap-3">
              {question.choices.map((choice, index) => {
                const selected = selectedAnswer === index;
                return (
                  <button
                    aria-pressed={selected}
                    className={`min-h-14 rounded-md border px-4 py-3 text-left text-base transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] ${
                      selected
                        ? "border-[#183d31] bg-[#e8eee8] font-semibold text-[#183d31]"
                        : "border-[#d8ded7] bg-white hover:border-[#8da596]"
                    }`}
                    key={choice}
                    onClick={() => setSelectedAnswer(index)}
                    type="button"
                  >
                    {choice}
                  </button>
                );
              })}
            </div>
            <button
              className="mt-6 min-h-14 w-full rounded-md bg-[#183d31] px-5 text-base font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-not-allowed disabled:opacity-45 sm:w-auto sm:min-w-48"
              disabled={selectedAnswer === null}
              onClick={continueQuiz}
              type="button"
            >
              {questionIndex === sampleQuiz.questions.length - 1 ? "Finish quiz" : "Next question"}
            </button>
          </>
        )}
      </section>
    </main>
  );
}