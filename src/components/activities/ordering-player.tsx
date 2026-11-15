// Ordering game: students move items up and down, then check the order.
"use client";

import { useState } from "react";
import type { OrderingContent } from "../../lib/schemas";
import { hashText, shuffledOrder } from "./matching-player";

export function OrderingPlayer({ content }: { content: OrderingContent }) {
  const total = content.items.length;
  const [round, setRound] = useState(0);
  // order[position] is the index of the item shown at that position. The correct order is 0, 1, 2...
  const [order, setOrder] = useState<number[]>(() => shuffledOrder(total, hashText(content.title)));
  const [checked, setChecked] = useState(false);

  const correctCount = order.filter((itemIndex, position) => itemIndex === position).length;
  const allCorrect = correctCount === total;

  function move(position: number, direction: -1 | 1) {
    const target = position + direction;
    if (checked || target < 0 || target >= total) return;
    setOrder((current) => {
      const next = [...current];
      [next[position], next[target]] = [next[target], next[position]];
      return next;
    });
  }

  function playAgain() {
    const nextRound = round + 1;
    setRound(nextRound);
    setOrder(shuffledOrder(total, hashText(content.title) + nextRound));
    setChecked(false);
  }

  const moveButton =
    "min-h-11 min-w-11 rounded-md border border-[#cbd4cb] bg-white px-3 text-base font-semibold text-[#294337] transition hover:bg-[#edf1ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-not-allowed disabled:opacity-35";

  return (
    <section aria-label="Ordering game" className="mt-7 border-t-2 border-[#183d31] bg-white p-5 shadow-[0_12px_36px_rgba(27,42,32,0.06)] sm:p-8">
      <p className="text-xs font-bold uppercase text-[#527264]">Ordering</p>
      <h1 className="mt-2 text-2xl font-semibold sm:text-3xl">{content.title}</h1>
      <p className="mt-2 text-sm leading-6 text-[#657067]">{content.instructions}</p>

      <ol className="mt-6 grid gap-3">
        {order.map((itemIndex, position) => {
          const isRight = itemIndex === position;
          return (
            <li
              className={`flex items-center gap-3 rounded-md border p-3 ${
                checked
                  ? isRight
                    ? "border-[#527264] bg-[#e8eee8]"
                    : "border-[#e0b9b5] bg-[#fbeeec]"
                  : "border-[#d8ded7] bg-white"
              }`}
              key={itemIndex}
            >
              <span className="w-6 shrink-0 text-sm font-semibold text-[#527264]">{position + 1}.</span>
              <span className="min-w-0 flex-1 text-base">{content.items[itemIndex]}</span>
              {checked ? (
                <span aria-label={isRight ? "Correct position" : "Wrong position"} className="shrink-0 text-lg font-semibold">
                  {isRight ? "✓" : "✗"}
                </span>
              ) : (
                <div className="flex shrink-0 gap-2">
                  <button aria-label={`Move "${content.items[itemIndex]}" up`} className={moveButton} disabled={position === 0} onClick={() => move(position, -1)} type="button">↑</button>
                  <button aria-label={`Move "${content.items[itemIndex]}" down`} className={moveButton} disabled={position === total - 1} onClick={() => move(position, 1)} type="button">↓</button>
                </div>
              )}
            </li>
          );
        })}
      </ol>

      {checked ? (
        <div className="mt-6">
          <p className="text-center text-5xl font-semibold text-[#183d31]">
            {correctCount}<span className="text-2xl text-[#657067]"> / {total}</span>
          </p>
          <p className="mt-2 text-center text-sm text-[#657067]">
            {allCorrect ? "Perfect order!" : "items in the right place"}
          </p>
          {!allCorrect && (
            <div className="mt-5 rounded-md bg-[#edf1ea] p-4 text-sm leading-6 text-[#294337]" role="status">
              <p className="font-semibold">The correct order:</p>
              <ol className="mt-2 list-decimal pl-5">
                {content.items.map((item) => <li key={item}>{item}</li>)}
              </ol>
            </div>
          )}
          <button
            className="mt-6 min-h-14 w-full rounded-md bg-[#183d31] px-5 text-base font-semibold text-white hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] sm:w-auto sm:min-w-48"
            onClick={playAgain}
            type="button"
          >
            Play again
          </button>
        </div>
      ) : (
        <button
          className="mt-6 min-h-14 w-full rounded-md bg-[#183d31] px-5 text-base font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] sm:w-auto sm:min-w-48"
          onClick={() => setChecked(true)}
          type="button"
        >
          Check order
        </button>
      )}
    </section>
  );
}