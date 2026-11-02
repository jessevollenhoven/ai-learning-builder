# Logbook

## Day 1 (2 Nov)
- Built: Next.js project, GitHub repo, Vercel deployment, Supabase project, email/password login (signup, login, logout, protected dashboard)
- Agent got wrong: it named the env var PUBLISHABLE_KEY in the docs example, but my project uses ANON_KEY (I caught this before building)
- Problems I fixed: PowerShell blocked npx (changed execution policy); typo in the supabase install command; Email provider was disabled in Supabase (signup returned 400)
- Learned: how proxy.ts refreshes the session, why getClaims() is used to protect pages