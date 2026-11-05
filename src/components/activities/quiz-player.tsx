// Runs the question flow, score, and replay for public or owner previews.
"use client";

import { useState } from "react";
import type { MultipleChoiceContent } from "../../lib/schemas";

type QuizPlayerProps = {
  content: MultipleChoiceContent;
};

export function QuizPlayer({ content }: QuizPlayerProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answerChecked, setAnswerChecked] = useState(false);
  const question = content.questions[questionIndex];

  function checkAnswer() {
    if (selectedAnswer === null || answerChecked) return;
    if (selectedAnswer === question.correctIndex) setScore((currentScore) => currentScore + 1);
    setAnswerChecked(true);
  }

  function continueQuiz() {
    if (!answerChecked) return;
    if (questionIndex === content.questions.length - 1) {
      setFinished(true);
      return;
    }
    setQuestionIndex(questionIndex + 1);
    setSelectedAnswer(null);
    setAnswerChecked(false);
  }

  function playAgain() {
    setQuestionIndex(0);
    setSelectedAnswer(null);
    setScore(0);
    setFinished(false);
    setAnswerChecked(false);
  }

  return (
    <section aria-label="Quiz" className="mt-7 border-t-2 border-[#183d31] bg-white p-5 shadow-[0_12px_36px_rgba(27,42,32,0.06)] sm:p-8">
      <p className="text-xs font-bold uppercase text-[#527264]">Multiple choice</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{content.title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#657067]">{content.instructions}</p>

      {finished ? (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-[#527264]">Quiz complete</p>
          <p className="mt-3 text-5xl font-semibold text-[#183d31]">
            {score}<span className="text-2xl text-[#657067]"> / {content.questions.length}</span>
          </p>
          <button
            className="mt-7 min-h-14 w-full rounded-md bg-[#183d31] px-5 text-base font-semibold text-white hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] sm:w-auto sm:min-w-48"
            onClick={playAgain}
            type="button"
          >
            Play again
          </button>
        </div>
      ) : (
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
      )}
    </section>
  );
}