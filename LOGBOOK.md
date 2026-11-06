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