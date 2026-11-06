// Renders large phone-friendly True and False answer buttons.
import type { ActivityPlayerProps } from "./player-types";

export function TrueFalsePlayer({ selectedAnswer, disabled, onSelectAnswer }: ActivityPlayerProps) {
  return (
    <div className="mt-6 grid grid-cols-2 gap-3">
      {[true, false].map((answer) => (
        <button
          aria-pressed={selectedAnswer === answer}
          className={`min-h-16 rounded-md border text-lg font-semibold transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] ${
            selectedAnswer === answer
              ? "border-[#183d31] bg-[#e8eee8] text-[#183d31]"
              : "border-[#d8ded7] bg-white text-[#294337] hover:border-[#8da596]"
          }`}
          disabled={disabled}
          key={String(answer)}
          onClick={() => onSelectAnswer(answer)}
          type="button"
        >
          {answer ? "True" : "False"}
        </button>
      ))}
    </div>
  );
}