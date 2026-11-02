// Keeps login and signup screens visually consistent.
import type { ReactNode } from "react";
import Link from "next/link";

type AuthLayoutProps = {
  title: string;
  description: string;
  children: ReactNode;
  footer: ReactNode;
};

export function AuthLayout({ title, description, children, footer }: AuthLayoutProps) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f4f4ef] px-5 py-12 text-[#20251f]">
      <section className="w-full max-w-[420px]">
        <Link href="/" className="mb-8 inline-flex items-center gap-3 text-sm font-semibold">
          <span className="grid size-10 place-items-center rounded-lg bg-[#183d31] text-lg font-bold text-[#d6f36a]">
            L
          </span>
          Lesson Foundry
        </Link>
        <div className="border-t-2 border-[#183d31] bg-white px-7 py-8 shadow-[0_16px_48px_rgba(27,42,32,0.08)] sm:px-9 sm:py-10">
          <p className="mb-3 text-xs font-bold uppercase text-[#527264]">
            Teacher workspace
          </p>
          <h1 className="text-3xl font-semibold">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-[#657067]">{description}</p>
          <div className="mt-8">{children}</div>
          <div className="mt-7 border-t border-[#e6e9e3] pt-5 text-sm text-[#657067]">
            {footer}
          </div>
        </div>
        <p className="mt-6 text-center text-xs text-[#818a81]">AI Learning Builder</p>
      </section>
    </main>
  );
}