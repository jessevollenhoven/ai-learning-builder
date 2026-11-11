# Logbook

## Day 1 (2 Nov)
- Built: Next.js project, GitHub repo, Vercel deployment, Supabase project, email/password login (signup, login, logout, protected dashboard)
- Agent got wrong: it named the env var PUBLISHABLE_KEY in the docs example, but my project uses ANON_KEY (I caught this before building)
- Problems I fixed: PowerShell blocked npx (changed execution policy); typo in the supabase install command; Email provider was disabled in Supabase (signup returned 400)
- Learned: how proxy.ts refreshes the session, why getClaims() is used to protect pages
- problems i encountered: worked on the wrong branch but resolved the issue

## Day 1 addendum (2 Nov)
- Slip: I committed the prototype on `chore/ci-and-logbook` instead of making a `feat/prototype` branch, so CI, logbook and prototype went into one pull request. Nothing was lost. Fix: I now run `git branch` before starting work and start each feature with `git checkout main`, `git pull`, `git checkout -b feat/name`.
- Built: front-end prototype with sample data (dashboard list, new activity screen with 5-type picker, multiple choice preview with score).

## Day 2 (3 Nov)
- Built:
  - `activities` table in Supabase with row-level security (4 policies: read, create, update, delete, all limited to the owner)
  - Zod schemas for multiple choice content and for the generate request (`src/lib/schemas.ts`)
  - Content checks for duplicate options, text lengths and question counts (`src/lib/checks.ts`), with 8 Vitest tests that also run in CI
  - Sample quiz now matches the schema, and the preview shows an explanation after each answer
  - `POST /api/generate`: checks login (401 if logged out), validates the request (400 if invalid), and returns the checked sample quiz when FAKE_MODE=true. Otherwise it returns 501 "AI not set up yet". The AI call will sit behind one small function so the provider can be swapped.
- Decisions:
  - No paid API key (no budget), so I'm building in fake mode and will ask Alex about a class key or a free model.
  - Only multiple choice is accepted for now, because it's the only template built.
  - Kept the question range at 5 to 15 instead of flagging more than 10, so a teacher asking for 12 questions or "add five more" isn't blocked.
- Agent got wrong: nothing major. It asked me two clarifying questions before planning, and I answered them. My test code used the wrong field names (`type`/`text`), and the real ones in `schemas.ts` are `activityType` and `teacherText`, so I now read the schema file instead of guessing.
- Not yet tested: the logged-in fake-mode response and RLS with two accounts (planned for Day 3, once saving exists).
- Learned: why RLS protects data even if the app code has a bug, and why the server checks the schema and the content checks before showing anything to the teacher.

## Day 3 (4 Nov)
- Built:
  - Generate button now calls `/api/generate`, with loading and friendly error states
  - Preview page: answer the quiz, refine by chat, and Save
  - Refine only replaces the current quiz if the result passes the schema and content checks. Otherwise the previous version is kept and an error is shown.
  - Save is a server action that checks login, validates the content, and inserts only type, title and content. `owner_id` is never sent, so the database fills it in.
  - Dashboard lists the teacher's real saved activities, newest first, with a "No activities yet" empty state, and each one reopens in the preview
  - The four unbuilt activity types are visible but disabled
  - Added tests for content validation and the save payload (12 tests total, all passing in CI)
- Decisions:
  - Still in fake mode, which returns the same sample quiz whatever the teacher types, and refine only adds "(refined)" to the title. This lets me build and test the whole flow with no AI cost.
  - Unsupported types are shown as disabled rather than hidden, so the roadmap is visible and enabling each one later is a small change.
- Agent got wrong:
  - It reported the work as done without being able to run tests, lint or the build. When I ran them, lint and the build failed on 4 problems: a missing `Link` import, an unescaped apostrophe, setState called inside a useEffect, and a type error (`string | undefined` passed to a state setter for a `string`). I sent the exact errors back, it fixed them, and I re-ran all three myself. Lesson: always run `npm test`, `npm run lint` and `npm run build` myself before committing.
- Tested:
  - Generate, refine, save and reopen from the dashboard all work locally
  - Row-level security with two accounts: [fill in what happened, e.g. "account B saw an empty dashboard and could not open account A's activity by its URL"]
- Still to do:
  - A real AI call for generation. I can't afford an API key, so I'm asking Alex about a class key or a free model.
  - Share link, then the other four templates
- Learned: why the server action leaves out `owner_id` (the database sets it from the logged-in user, so a teacher can't save a row under someone else's name), and why failed refinements keep the previous version.

## Day 4 (5 Nov)
- Built: public share link
  - Added a `shared` column (default false) and an RLS policy so anyone can read a row only when `shared = true`. Teachers' other policies still stop anyone else editing or deleting.
  - Owner-only Share toggle and "Copy link" on a saved activity, using a server action that checks login and updates only `shared`
  - Public page `/a/<id>`: no login, one question at a time, score at the end, no refine/save/share controls. The content is validated with the Zod schema first. A missing, unshared or invalid activity shows "This activity isn't available".
  - Extracted a shared quiz player used by both the owner preview and the public page
- Tested:
  - Unshared activity is not viewable in an incognito window: [pass/fail]
  - Unsharing, then refreshing, shows the friendly message: [pass/fail]
  - Account B cannot switch sharing on for account A's activity: [pass/fail]
  - Phone test of the live share link: [result]
- Agent got wrong / problems:
  - I committed work on the wrong branch earlier and a `feat/real-ai` branch already existed. I checked with `git branch --no-merged main` that nothing was lost, then switched to it.
  - Copilot's first build attempt did nothing because it was not in Agent mode (no edit or terminal tools). I switched mode and re-sent.

## Day 4 (continued): real AI generation
- Built:
  - Replaced the AI stub with a real Gemini call (`src/lib/gemini.ts`): server-side only, structured JSON output, `store: false`, key read from `GEMINI_API_KEY`. The model is set by `GEMINI_MODEL`, so swapping is one line.
  - Output is still validated with the Zod schema and content checks. If it fails, the problems go back to the AI once for a repair. If that fails too, the teacher sees a friendly error and the previous version is kept.
  - Rate limits, timeouts, blocked or empty responses map to friendly messages. No key, headers or upstream bodies are exposed.
  - Tests mock the provider, so no real AI calls run in CI.
- Decisions:
  - I can't afford a paid API key, so I used Google's free Gemini tier rather than Sonnet 5.5 (the brief only recommends Sonnet). [Say whether Alex approved this.]
  - Free-tier content may be used to improve Google's products, so teachers must not paste children's names or personal details. This goes in the README as a POPIA note.
- Problems and fixes:
  - Generation showed "temporarily unavailable". A safe error log showed Google returning 503 "high demand" for `gemini-3.5-flash-lite`, so the cause was Google's capacity, not my code. Switching to [`gemini-3.1-flash-lite`] worked.
  - The agent claimed `gemini-3.8-flash` was free-tier eligible. My own search turned up only its paid introductory price, so I made the agent re-check the pricing page before building.
  - I had to run `npm test`, lint and build myself, because an earlier agent report of "done" hid four errors.
- Still to do:
  - Retry with a short wait, then a fallback model, for 503/429 errors (free models can be busy on demo day)
  - Add `GEMINI_API_KEY`, `GEMINI_MODEL` and `FAKE_MODE=false` in Vercel after merging, redeploy, and test on my phone
  - Write the 10-request test set from real generations
  - Applied for the GitHub Student Developer Pack in case Copilot credits run low: [status]
- Learned: why the API key stays on the server and out of git, why AI output is validated even with structured output (Google doesn't enforce string lengths or duplicates), and why a friendly error needs a safe log behind it so the real cause can be found.

## Day 5 ([6 Nov])
- Built: activity type registry and true/false
  - One registry file (`src/lib/activity-types.ts`) now holds each type's label, whether it is enabled, its Zod schema, content checks, AI prompt, fake-mode sample and player. Adding a type is one registry entry plus one player, with no changes to the route, builder or share page.
  - Content is now a discriminated union on `type`. Generate, refine, save, the dashboard, the preview and the public `/a/<id>` page all go through the same validation (`validateActivityContent`).
  - True/false: 5 to 15 statements with a boolean answer and a short explanation. Large True and False buttons for phones.
  - The public page and save action reject a row whose saved `type` doesn't match its content.
- Decisions:
  - Kept the existing multiple choice player behaviour unchanged, and made old saved activities keep working.
  - Flashcards, matching and ordering stay visible but disabled with a "Coming soon" label until their templates exist.
- Agent got wrong / problems:
  - Copilot hit its monthly credit limit part-way through the build (resets 1 December). It had added the registry and players but never wired them up, so `npm run build` failed on a stale import of `activityTypes` from `sample-data.ts`. I finished the wiring by hand, using Claude in chat to write the code and pasting it in myself.
  - Copilot's earlier "plan" had been reported as implemented when it wasn't. Lesson: check `git status` and run the checks instead of trusting the summary.
  - The agent left unused helper functions in `activity-types.ts` and an unused variable in the true/false player. I removed them (lint now reports nothing).
  - My own mistake: I pasted `activityType: "content.type,"` as a string in `quiz-preview.tsx`, so Refine returned 400 "Invalid input". I found it by opening the browser Network tab, then Payload, and saw the literal text. I removed the quotes.
- Tested:
  - `npm test`, `npm run lint` and `npm run build` all pass (36 tests)
  - Multiple choice still works: generate, refine, save, reopen: [pass/fail]
  - Older saved activities still open: [pass/fail]
  - True/false: generate, play, refine, save, share, public page in incognito: [pass/fail]
  - Real AI true/false from my own notes: [what happened, were the answers correct and mixed true/false?]
- Learned: why a registry beats `if (type === ...)` checks scattered through the app, why the server validates content before it is saved or shown, and how to read a failed request in the browser's Network tab.

## Day 6 ([8 Nov])
- Built: flashcards
  - New Zod schema: 5 to 20 cards, each with a `front` and a `back`
  - Content checks: empty front or back, duplicate fronts (ignoring case and spaces), text too long for a phone (front 120, back 250), and deck size
  - 6 new tests for these checks (42 tests in total, all passing)
  - A separate flip-card player: tap to flip, then "I knew it" or "Still learning", and a final tally with Play again. The shared question player was split into `QuizPlayer` (chooses the player) and `QuestionPlayer` (the existing flow), so multiple choice and true/false are unchanged.
  - Gemini prompt and JSON schema for flashcards, and a fake-mode sample deck
- Decisions:
  - Flashcards got their own player instead of being squeezed into the answer-and-check flow, because there is no right or wrong answer to check.
  - The final score is the number of cards the student said they knew.
- Agent got wrong / problems: [none this time, or note anything. Code was written with Claude in chat because Copilot credits were used up. I pasted it in, ran `npm test`, `npm run lint` and `npm run build`, and tested it in the browser.]
- Tested:
  - Flip, tally and Play again work: [pass/fail]
  - Save, share and public page in incognito: [pass/fail]
  - Dashboard shows the "Flashcards" label: [pass/fail]
  - Multiple choice and true/false still work: [pass/fail]
  - On my phone: [result]
  - Real AI deck from my own notes: [result, were the fronts distinct and the backs accurate?]
- Still to do:
  - Matching and ordering templates
  - Direct editing without AI (change text, add, delete, reorder)
  - Retry and fallback model for 503 errors from the free Gemini tier
  - 10-request test set, README (including the POPIA note about free-tier data), and an email-confirmation switch-on before the demo
  - Applied for the GitHub Student Developer Pack for Copilot credits: [status]
- Learned: why each activity type needs its own checks (flashcards care about duplicate fronts, quizzes about duplicate options), and how splitting a component keeps old features from breaking while a new one is added.

## Day 7 ([date]) (written up on [date, if later])
- Built:
  - Retry and fallback for the free Gemini tier (`src/lib/gemini.ts`). On a 429, 5xx or timeout it waits 1 second, then 3 seconds, retries, then tries a fallback model (`GEMINI_FALLBACK_MODEL`). It stops after about 30 seconds so the page doesn't hang. It does not retry a bad key or a bad request, because that can't succeed. `route.ts` allows up to 60 seconds.
  - Direct editing without AI (`activity-editor.tsx`): edit the title, instructions and every item of multiple choice, true/false and flashcards, mark the correct answer, add and delete items, and reorder with Move up / Move down buttons. Edits work on a copy and go through the same Zod schema and content checks as AI output, so a teacher sees plain-English problems before anything changes. Cancel discards them.
  - Saved activities now update in place (`updateActivity` server action: checks login, validates, updates only `title`, `content` and `updated_at`, and matches on `type` so an edit can't turn one type into another). Before, "Save a copy" made a duplicate every time.
- Decisions:
  - Up and down buttons instead of drag and drop, because they work on phones and are simpler to build and test.
  - Hand edits are applied to the preview first and only saved when the teacher chooses Save changes.
- Agent got wrong / problems:
  - The old Gemini logging test expected one error log, but with retries a failing request now logs six (three attempts on each of two models), so the test failed. I updated the expected count. A second test timed out because the retry waits made it slow, so the waits are now skipped when `NODE_ENV` is "test".
  - Copilot credits are still used up, so the code was written with Claude in chat and I pasted it in, ran `npm test`, `npm run lint` and `npm run build`, and tested it in the browser.
- Tested:
  - Retry and fallback with real AI: [result, did a busy model recover or fall back?]
  - Edit by hand on all three types, including add, delete, reorder and a validation error: [pass/fail]
  - Edit then Save changes on a saved activity, no duplicate, edit visible after a refresh and on the public link: [pass/fail]
  - Two-account test: [see below]
- Two-account test finding:
  - Testing with two tabs in one browser showed the same data for both accounts, because the tabs share one login cookie. Repeated with a normal window and an incognito window: [what you saw].
  - Separately, I found a real weakness: the share policy ("anyone can read rows where `shared = true`") also applies to signed-in users, and the dashboard and owner preview relied on RLS alone, so another teacher's shared activity could appear there. Fix: filter both by `owner_id` from the verified login claims. Re-tested: [result, only if you applied the fix].
- Still to do: matching and ordering templates, the 10-request test set, the README (including the POPIA note), turning email confirmation back on, delete with confirmation, phone testing, and a real teacher test if possible.
- Learned: why a read policy for strangers needs a matching owner filter in the app, why two tabs in one browser share a session, and why retries should only happen for errors that can fix themselves.