// Lets a teacher edit any activity by hand: change text, add, delete and reorder items.
"use client";

import { useState } from "react";
import { validateActivityContent } from "../../lib/activity-types";
import type { ActivityContent } from "../../lib/schemas";

type ActivityEditorProps = {
  content: ActivityContent;
  onApply: (content: ActivityContent) => void;
  onCancel: () => void;
};

const inputClass =
  "w-full min-w-0 rounded-md border border-[#d8ded7] bg-white p-3 text-base font-normal outline-none focus:border-[#527264] focus:ring-2 focus:ring-[#527264]/15";
const smallButton =
  "min-h-11 rounded-md border border-[#cbd4cb] bg-white px-3 text-sm font-semibold text-[#294337] transition hover:bg-[#edf1ea] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31] disabled:cursor-not-allowed disabled:opacity-40";

// Moves one item in a list, in place.
function moveItem<T>(items: T[], from: number, to: number) {
  if (to < 0 || to >= items.length) return;
  const [item] = items.splice(from, 1);
  items.splice(to, 0, item);
}

function TextField({
  label,
  value,
  onChange,
  multiline = false,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  multiline?: boolean;
}) {
  return (
    <label className="mt-3 block text-sm font-semibold">
      {label}
      {multiline ? (
        <textarea className={`mt-1 min-h-20 ${inputClass}`} onChange={(event) => onChange(event.target.value)} value={value} />
      ) : (
        <input className={`mt-1 ${inputClass}`} onChange={(event) => onChange(event.target.value)} type="text" value={value} />
      )}
    </label>
  );
}

function ItemControls({
  index,
  total,
  minItems,
  onMove,
  onDelete,
}: {
  index: number;
  total: number;
  minItems: number;
  onMove: (to: number) => void;
  onDelete: () => void;
}) {
  return (
    <div className="mt-4 flex flex-wrap gap-2">
      <button className={smallButton} disabled={index === 0} onClick={() => onMove(index - 1)} type="button">Move up</button>
      <button className={smallButton} disabled={index === total - 1} onClick={() => onMove(index + 1)} type="button">Move down</button>
      <button className={smallButton} disabled={total <= minItems} onClick={onDelete} type="button">Delete</button>
    </div>
  );
}

export function ActivityEditor({ content, onApply, onCancel }: ActivityEditorProps) {
  const [draft, setDraft] = useState<ActivityContent>(() => structuredClone(content));
  const [problems, setProblems] = useState<string[]>([]);

  // Works on a copy, so nothing changes until the teacher chooses Apply.
  function update(change: (next: ActivityContent) => void) {
    setDraft((current) => {
      const next = structuredClone(current);
      change(next);
      return next;
    });
  }

  function apply() {
    const result = validateActivityContent(draft);
    if (!result.success) {
      setProblems(result.problems);
      return;
    }
    setProblems([]);
    onApply(result.data);
  }

  return (
    <section aria-label="Edit activity" className="mt-7 border-t-2 border-[#183d31] bg-white p-5 sm:p-8">
      <h2 className="text-xl font-semibold">Edit by hand</h2>
      <p className="mt-1 text-sm text-[#657067]">Change any text, then choose Apply changes. Nothing is saved until you save.</p>

      <TextField label="Title" onChange={(value) => update((d) => { d.title = value; })} value={draft.title} />
      <TextField label="Instructions" multiline onChange={(value) => update((d) => { d.instructions = value; })} value={draft.instructions} />

      {draft.type === "multiple_choice" && (
        <div className="mt-6 grid gap-5">
          {draft.questions.map((question, qIndex) => (
            <fieldset className="border border-[#d8ded7] p-4" key={qIndex}>
              <legend className="px-1 text-sm font-semibold">Question {qIndex + 1}</legend>
              <TextField label="Question" multiline onChange={(value) => update((d) => { if (d.type === "multiple_choice") d.questions[qIndex].question = value; })} value={question.question} />
              <p className="mt-3 text-sm font-semibold">Options (select the correct one)</p>
              {question.options.map((option, oIndex) => (
                <div className="mt-2 flex items-center gap-3" key={oIndex}>
                  <input
                    aria-label={`Mark option ${oIndex + 1} as correct`}
                    checked={question.correctIndex === oIndex}
                    className="h-5 w-5 shrink-0"
                    name={`correct-${qIndex}`}
                    onChange={() => update((d) => { if (d.type === "multiple_choice") d.questions[qIndex].correctIndex = oIndex; })}
                    type="radio"
                  />
                  <input
                    aria-label={`Option ${oIndex + 1}`}
                    className={inputClass}
                    onChange={(event) => update((d) => { if (d.type === "multiple_choice") d.questions[qIndex].options[oIndex] = event.target.value; })}
                    type="text"
                    value={option}
                  />
                </div>
              ))}
              <TextField label="Explanation" multiline onChange={(value) => update((d) => { if (d.type === "multiple_choice") d.questions[qIndex].explanation = value; })} value={question.explanation} />
              <ItemControls
                index={qIndex}
                minItems={5}
                onDelete={() => update((d) => { if (d.type === "multiple_choice") d.questions.splice(qIndex, 1); })}
                onMove={(to) => update((d) => { if (d.type === "multiple_choice") moveItem(d.questions, qIndex, to); })}
                total={draft.questions.length}
              />
            </fieldset>
          ))}
          <button
            className={smallButton}
            disabled={draft.questions.length >= 15}
            onClick={() => update((d) => {
              if (d.type === "multiple_choice") {
                d.questions.push({
                  question: "New question",
                  options: ["Option 1", "Option 2", "Option 3", "Option 4"],
                  correctIndex: 0,
                  explanation: "Explain why this answer is correct.",
                });
              }
            })}
            type="button"
          >
            Add a question
          </button>
        </div>
      )}

      {draft.type === "true_false" && (
        <div className="mt-6 grid gap-5">
          {draft.statements.map((item, index) => (
            <fieldset className="border border-[#d8ded7] p-4" key={index}>
              <legend className="px-1 text-sm font-semibold">Statement {index + 1}</legend>
              <TextField label="Statement" multiline onChange={(value) => update((d) => { if (d.type === "true_false") d.statements[index].statement = value; })} value={item.statement} />
              <div aria-label={`Answer for statement ${index + 1}`} className="mt-3 flex gap-5" role="radiogroup">
                {[true, false].map((answer) => (
                  <label className="flex min-h-11 items-center gap-2 text-sm font-semibold" key={String(answer)}>
                    <input
                      checked={item.answer === answer}
                      className="h-5 w-5"
                      name={`answer-${index}`}
                      onChange={() => update((d) => { if (d.type === "true_false") d.statements[index].answer = answer; })}
                      type="radio"
                    />
                    {answer ? "True" : "False"}
                  </label>
                ))}
              </div>
              <TextField label="Explanation" multiline onChange={(value) => update((d) => { if (d.type === "true_false") d.statements[index].explanation = value; })} value={item.explanation} />
              <ItemControls
                index={index}
                minItems={5}
                onDelete={() => update((d) => { if (d.type === "true_false") d.statements.splice(index, 1); })}
                onMove={(to) => update((d) => { if (d.type === "true_false") moveItem(d.statements, index, to); })}
                total={draft.statements.length}
              />
            </fieldset>
          ))}
          <button
            className={smallButton}
            disabled={draft.statements.length >= 15}
            onClick={() => update((d) => {
              if (d.type === "true_false") {
                d.statements.push({ statement: "New statement", answer: true, explanation: "Explain the answer." });
              }
            })}
            type="button"
          >
            Add a statement
          </button>
        </div>
      )}

      {draft.type === "flashcards" && (
        <div className="mt-6 grid gap-5">
          {draft.cards.map((card, index) => (
            <fieldset className="border border-[#d8ded7] p-4" key={index}>
              <legend className="px-1 text-sm font-semibold">Card {index + 1}</legend>
              <TextField label="Front" onChange={(value) => update((d) => { if (d.type === "flashcards") d.cards[index].front = value; })} value={card.front} />
              <TextField label="Back" multiline onChange={(value) => update((d) => { if (d.type === "flashcards") d.cards[index].back = value; })} value={card.back} />
              <ItemControls
                index={index}
                minItems={5}
                onDelete={() => update((d) => { if (d.type === "flashcards") d.cards.splice(index, 1); })}
                onMove={(to) => update((d) => { if (d.type === "flashcards") moveItem(d.cards, index, to); })}
                total={draft.cards.length}
              />
            </fieldset>
          ))}
          <button
            className={smallButton}
            disabled={draft.cards.length >= 20}
            onClick={() => update((d) => {
              if (d.type === "flashcards") {
                d.cards.push({ front: `New term ${d.cards.length + 1}`, back: "Definition" });
              }
            })}
            type="button"
          >
            Add a card
          </button>
        </div>
      )}

      {problems.length > 0 && (
        <div className="mt-6 rounded-md bg-[#fbeeec] p-4 text-sm text-[#a3332d]" role="alert">
          <p className="font-semibold">Please fix these before applying:</p>
          <ul className="mt-2 list-disc pl-5">
            {problems.map((problem) => <li key={problem}>{problem}</li>)}
          </ul>
        </div>
      )}

      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <button
          className="min-h-14 rounded-md bg-[#183d31] px-5 text-base font-semibold text-white transition hover:bg-[#245541] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#183d31]"
          onClick={apply}
          type="button"
        >
          Apply changes
        </button>
        <button className={`${smallButton} min-h-14 text-base`} onClick={onCancel} type="button">Cancel</button>
      </div>
    </section>
  );
}