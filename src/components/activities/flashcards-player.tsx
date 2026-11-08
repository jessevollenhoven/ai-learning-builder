// Flip-card study flow: show the front, flip to the back, then tally "knew it" or "still learning".
"use client";

import { useState } from "react";
import type { FlashcardsContent } from "../../lib/schemas";

export function FlashcardPlayer({ content }: { content: FlashcardsContent }) {
  const [index, setIndex] = useState(0);
  const [flipped, setFlipped] = useState(false);
  const [knownCount, setKnownCount] = useState(0);
  const [finished, setFinished] = useState(false);
  const total = content.cards.length;
  const card = content.cards[index];

  function answer(knewIt: boolean) {
    if (knewIt) setKnownCount((count) => count + 1);
    if (index === total - 1) {
      setFinished(true);
      return;
    }
    setIndex(index + 1);
    setFlipped(false);
  }

  function playAgain() {
    setIndex(0);
    setFlipped(false);
    setKnownCount(0);
    setFinished(false);
  }

  return (
    <section aria-label="Flashcards" className="mt-7 border-t-2 border-[#183d31] bg-white p-5 shadow-[0_12px_36px_rgba(27,42,32,0.06)] sm:p-8">
      <p className="text-xs font-bold uppercase text-[#527264]">Flashcards</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{content.title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#657067]">{content.instructions}</p>

      {finished ? (
        <div className="py-8 text-center">
          <p className="text-sm font-semibold text-[#527264]">Deck complete</p>
          <p className="mt-3 text-5xl font-semibold text-[#183d31]">
            {knownCount}<span className="text-2xl text-[#657067]"> / {total}</span>
          </p>
          <p className="mt-2 text-sm text-[#657067]">cards you knew</p>
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
          <p className="mt-7 text-sm font-medium text-[#657067]">Card {index + 1} of {total}</p>
          <button
            aria-label={flipped ? "Showing the back. Tap to see the front." : "Showing the front. Tap to see the back."}
            className="mt-4 flex min-h-56 w-full flex-col items-center justify-center rounded-md border border-[#d8ded7] bg-[#f8f9f6] p-6 text-center transition hover:border-[#8da596] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31]"
            onClick={() => setFlipped((value) => !value)}
            type="button"
          >
            <span className="text-xs font-bold uppercase text-[#527264]">{flipped ? "Back" : "Front"}</span>
            <span className="mt-3 text-2xl font-semibold leading-8">{flipped ? card.back : card.front}</span>
            <span className="mt-4 text-xs text-[#818a81]">Tap the card to flip it</span>
          </button>

          {flipped && (
            <div className="mt-5 grid grid-cols-2 gap-3">
              <button
                className="min-h-14 rounded-md border border-[#d8ded7] bg-white px-4 text-base font-semibold text-[#294337] transition hover:border-[#8da596] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31]"
                onClick={() => answer(false)}
                type="button"
              >
                Still learning
              </button>
              <button
                className="min-h-14 rounded-md bg-[#183d31] px-4 text-base font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31]"
                onClick={() => answer(true)}
                type="button"
              >
                I knew it
              </button>
            </div>
          )}
        </>
      )}
    </section>
  );
}