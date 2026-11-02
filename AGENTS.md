<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
# Project: AI Learning Builder (Option 1)

Teachers generate learning activities with AI; students play them via a public link.

## Rules (non-negotiable)
1. API key stays on the server (Vercel env vars). Never in browser code, commits, or prompts.
2. Fake mode: FAKE_MODE=true makes /api/generate return saved samples. Use it for all UI work.
3. AI text is always rendered as text, never as HTML. No dangerouslySetInnerHTML.
4. Row-level security on every table. Teachers only read/change their own rows.
5. Use claude-sonnet-5-5 for generation.

## Stack
Next.js (App Router) + TypeScript + Tailwind, Supabase (auth + db), Zod, Vitest, Anthropic SDK.

## Where things live
- Zod schemas: src/lib/schemas.ts
- Content checks: src/lib/checks.ts
- AI endpoint: src/app/api/generate/route.ts
- Public activity page: src/app/a/[id]/page.tsx

## Workflow
- Plan first, then build. One feature per PR. Never commit .env files.
- Write tests for risky logic (content checks).