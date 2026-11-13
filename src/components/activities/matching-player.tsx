// Tap-then-tap matching game: tap a term, then tap the partner that goes with it.
"use client";

import { useState } from "react";
import type { MatchingContent } from "../../lib/schemas";

// The same text always gives the same number, so the server and the browser shuffle the same way.
function hashText(text: string): number {
  let hash = 2166136261;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 16777619);
  }
  return hash >>> 0;
}

// A small seeded random number generator (mulberry32).
function makeRandom(seed: number) {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Returns the numbers 0 to count-1 in a shuffled order that is never the original order.
function shuffledOrder(count: number, seed: number): number[] {
  const order = Array.from({ length: count }, (_, index) => index);
  const random = makeRandom(seed);
  for (let i = count - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [order[i], order[j]] = [order[j], order[i]];
  }
  if (order.every((value, index) => value === index)) {
    order.push(order.shift() as number);
  }
  return order;
}

export function MatchingPlayer({ content }: { content: MatchingContent }) {
  const total = content.pairs.length;
  const [round, setRound] = useState(0);
  const [selectedLeft, setSelectedLeft] = useState<number | null>(null);
  const [matched, setMatched] = useState<boolean[]>(() => new Array<boolean>(total).fill(false));
  const [missed, setMissed] = useState<boolean[]>(() => new Array<boolean>(total).fill(false));
  const [message, setMessage] = useState("");

  const rightOrder = shuffledOrder(total, hashText(content.title) + round);
  const matchedCount = matched.filter(Boolean).length;
  const finished = matchedCount === total;
  // The score is the number of pairs matched without a wrong guess.
  const score = missed.filter((wasMissed) => !wasMissed).length;

  function tapLeft(index: number) {
    if (matched[index]) return;
    setSelectedLeft(selectedLeft === index ? null : index);
    setMessage("");
  }

  function tapRight(index: number) {
    if (matched[index]) return;
    if (selectedLeft === null) {
      setMessage("Tap a term on the left first.");
      return;
    }
    if (selectedLeft === index) {
      setMatched((current) => current.map((value, i) => (i === index ? true : value)));
      setSelectedLeft(null);
      setMessage("Correct!");
      return;
    }
    setMissed((current) => current.map((value, i) => (i === selectedLeft ? true : value)));
    setMessage("Not quite. Try another partner.");
  }

  function playAgain() {
    setRound((current) => current + 1);
    setSelectedLeft(null);
    setMatched(new Array<boolean>(total).fill(false));
    setMissed(new Array<boolean>(total).fill(false));
    setMessage("");
  }

  function buttonClass(isMatched: boolean, isSelected: boolean) {
    const base =
      "min-h-14 w-full rounded-md border px-3 py-3 text-left text-base transition focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31]";
    if (isMatched) return `${base} border-[#527264] bg-[#e8eee8] text-[#527264] opacity-70`;
    if (isSelected) return `${base} border-[#183d31] bg-[#e8eee8] font-semibold text-[#183d31]`;
    return `${base} border-[#d8ded7] bg-white hover:border-[#8da596]`;
  }

  return (
    <section aria-label="Matching game" className="mt-7 border-t-2 border-[#183d31] bg-white p-5 shadow-[0_12px_36px_rgba(27,42,32,0.06)] sm:p-8">
      <p className="text-xs font-bold uppercase text-[#527264]">Matching</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{content.title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#657067]">{content.instructions}</p>

      {finished ? (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-[#527264]">All matched</p>
          <p className="mt-3 text-5xl font-semibold text-[#183d31]">
            {score}<span className="text-2xl text-[#657067]"> / {total}</span>
          </p>
          <p className="mt-2 text-sm text-[#657067]">matched on the first try</p>
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
          <p className="mt-7 text-sm font-medium text-[#657067]">Matched {matchedCount} of {total}</p>
          <div className="mt-4 grid grid-cols-2 gap-3">
            <div className="grid content-start gap-3">
              {content.pairs.map((pair, index) => (
                <button
                  aria-pressed={selectedLeft === index}
                  className={buttonClass(matched[index], selectedLeft === index)}
                  disabled={matched[index]}
                  key={index}
                  onClick={() => tapLeft(index)}
                  type="button"
                >
                  {matched[index] && <span aria-hidden="true">✓ </span>}{pair.left}
                </button>
              ))}
            </div>
            <div className="grid content-start gap-3">
              {rightOrder.map((index) => (
                <button
                  className={buttonClass(matched[index], false)}
                  disabled={matched[index]}
                  key={index}
                  onClick={() => tapRight(index)}
                  type="button"
                >
                  {matched[index] && <span aria-hidden="true">✓ </span>}{content.pairs[index].right}
                </button>
              ))}
            </div>
          </div>
          <p className="mt-4 min-h-6 text-sm text-[#294337]" role="status">{message}</p>
        </>
      )}
    </section>
  );
}