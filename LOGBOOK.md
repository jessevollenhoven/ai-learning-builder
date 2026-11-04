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