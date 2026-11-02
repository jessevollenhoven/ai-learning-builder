// Verifies the Supabase identity before rendering the protected workspace.
import Link from "next/link";
import { redirect } from "next/navigation";
import { LogoutButton } from "../../components/auth/logout-button";
import { createClient } from "../../lib/supabase/server";

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }
  const claims = data.claims;

  return (
    <main className="min-h-screen bg-[#f4f4ef] text-[#20251f]">
      <header className="border-b border-[#dfe4dc] bg-white">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-4 sm:px-8">
          <Link href="/" className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-[#183d31] font-bold text-[#d6f36a]">
              L
            </span>
            Lesson Foundry
          </Link>
          <LogoutButton />
        </div>
      </header>
      <section className="mx-auto max-w-6xl px-5 py-14 sm:px-8 sm:py-20">
        <p className="text-xs font-bold uppercase text-[#527264]">
          Teacher workspace
        </p>
        <h1 className="mt-3 text-4xl font-semibold sm:text-5xl">Dashboard</h1>
        <p className="mt-4 text-sm text-[#657067]">Signed in as {claims.email ?? "teacher"}</p>
        <div className="mt-12 border-t border-[#cbd4cb] pt-6">
          <p className="text-sm text-[#657067]">Your learning activities will appear here.</p>
        </div>
      </section>
    </main>
  );
}