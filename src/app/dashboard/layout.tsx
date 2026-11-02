// Protects every dashboard route and shares its navigation shell.
import Link from "next/link";
import { redirect } from "next/navigation";
import type { ReactNode } from "react";
import { LogoutButton } from "../../components/auth/logout-button";
import { createClient } from "../../lib/supabase/server";

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getClaims();

  if (error || !data?.claims) {
    redirect("/login");
  }

  return (
    <div className="min-h-screen bg-[#f4f4ef] text-[#20251f]">
      <header className="border-b border-[#dfe4dc] bg-white">
        <div className="mx-auto flex min-h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-8">
          <Link href="/dashboard" className="flex items-center gap-3 text-sm font-semibold">
            <span className="grid size-9 place-items-center rounded-md bg-[#183d31] font-bold text-[#d6f36a]">
              L
            </span>
            Lesson Foundry
          </Link>
          <LogoutButton />
        </div>
      </header>
      {children}
    </div>
  );
}