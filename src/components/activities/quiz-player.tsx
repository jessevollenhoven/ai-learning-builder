// Runs the question flow, score, and replay for any registered activity type.
"use client";

import { useState } from "react";
import { activityTypes } from "../../lib/activity-types";
import type { ActivityContent } from "../../lib/schemas";

type QuizPlayerProps = {
  content: ActivityContent;
};

function countItems(content: ActivityContent): number {
  return content.type === "multiple_choice" ? content.questions.length : content.statements.length;
}

export function QuizPlayer({ content }: QuizPlayerProps) {
  const [questionIndex, setQuestionIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | boolean | null>(null);
  const [score, setScore] = useState(0);
  const [finished, setFinished] = useState(false);
  const [answerChecked, setAnswerChecked] = useState(false);

  const definition = activityTypes[content.type];
  const Player = definition.player;
  const total = countItems(content);

  if (!Player || !definition.getQuestion) {
    return <p className="mt-7 text-sm text-[#a3332d]" role="alert">This activity type isn&apos;t available yet.</p>;
  }
  const question = definition.getQuestion(content, questionIndex);

  function checkAnswer() {
    if (selectedAnswer === null || answerChecked) return;
    if (selectedAnswer === question.correctAnswer) setScore((currentScore) => currentScore + 1);
    setAnswerChecked(true);
  }

  function continueQuiz() {
    if (!answerChecked) return;
    if (questionIndex === total - 1) {
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
      <p className="text-xs font-bold uppercase text-[#527264]">{definition.label}</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{content.title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#657067]">{content.instructions}</p>

      {finished ? (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-[#527264]">Quiz complete</p>
          <p className="mt-3 text-5xl font-semibold text-[#183d31]">
            {score}<span className="text-2xl text-[#657067]"> / {total}</span>
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
            Question {questionIndex + 1} of {total}
          </p>
          <h2 className="mt-4 text-xl font-semibold leading-7 sm:text-2xl">{question.prompt}</h2>
          <Player
            question={question}
            selectedAnswer={selectedAnswer}
            disabled={answerChecked}
            onSelectAnswer={setSelectedAnswer}
          />
          {answerChecked && (
            <p className="mt-4 rounded-md bg-[#edf1ea] p-4 text-sm leading-6 text-[#294337]" role="status">
              {selectedAnswer === question.correctAnswer ? "Correct. " : "Not quite. "}
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
              ? questionIndex === total - 1 ? "Finish quiz" : "Next question"
              : "Check answer"}
          </button>
        </>
      )}
    </section>
  );
}