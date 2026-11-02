// Ends the browser session and returns the teacher to login.
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export function LogoutButton() {
  const router = useRouter();
  const [pending, setPending] = useState(false);
  const [error, setError] = useState("");

  async function handleLogout() {
    setPending(true);
    setError("");
    const { error: signOutError } = await createClient().auth.signOut();

    if (signOutError) {
      setError("Could not log out. Please try again.");
      setPending(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {error && <span className="text-xs text-[#a3332d]" role="alert">{error}</span>}
      <button
        className="rounded-md border border-[#cbd4cb] px-4 py-2 text-sm font-semibold text-[#294337] transition hover:bg-[#edf1ea] disabled:opacity-60"
        type="button"
        disabled={pending}
        onClick={handleLogout}
      >
        {pending ? "Signing out..." : "Log out"}
      </button>
    </div>
  );
}