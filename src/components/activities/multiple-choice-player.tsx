// Renders the choices for one multiple-choice question.
import type { ActivityPlayerProps } from "./player-types";

export function MultipleChoicePlayer({ question, selectedAnswer, disabled, onSelectAnswer }: ActivityPlayerProps) {
  return (
    <div className="mt-6 grid gap-3">
      {question.options?.map((option, index) => (
        <button
          aria-pressed={selectedAnswer === index}
          className={`min-h-14 rounded-md border px-4 py-3 text-left text-base transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] ${
            selectedAnswer === index
              ? "border-[#183d31] bg-[#e8eee8] font-semibold text-[#183d31]"
              : "border-[#d8ded7] bg-white hover:border-[#8da596]"
          }`}
          disabled={disabled}
          key={option}
          onClick={() => onSelectAnswer(index)}
          type="button"
        >
          {option}
        </button>
      ))}
    </div>
  );
}