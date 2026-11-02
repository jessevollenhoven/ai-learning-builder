// Provides a simple entry point for teachers visiting the app.
import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col bg-[#f4f4ef] text-[#20251f]">
      <header className="border-b border-[#dfe4dc] bg-white">
        <div className="mx-auto flex w-full max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-[#183d31] font-bold text-[#d6f36a]">
              L
            </span>
            Lesson Foundry
          </div>
          <Link className="text-sm font-semibold text-[#285c43] hover:underline" href="/login">
            Sign in
          </Link>
        </div>
      </header>
      <section className="mx-auto flex w-full max-w-6xl flex-1 flex-col justify-center px-5 py-16 sm:px-8">
        <p className="text-xs font-bold uppercase text-[#527264]">
          Teacher workspace
        </p>
        <h1 className="mt-4 max-w-2xl text-4xl font-semibold sm:text-6xl">
          Learning starts with a good question.
        </h1>
        <div className="mt-8 flex flex-wrap items-center gap-5">
          <Link
            className="inline-flex h-12 items-center rounded-md bg-[#183d31] px-5 text-sm font-semibold text-white transition hover:bg-[#245541]"
            href="/signup"
          >
            Create an account
          </Link>
          <Link className="text-sm font-semibold text-[#285c43] hover:underline" href="/login">
            I already have an account
          </Link>
        </div>
      </section>
      <footer className="border-t border-[#dfe4dc] px-5 py-4 text-center text-xs text-[#818a81]">
        AI Learning Builder
      </footer>
    </main>
  );
}
