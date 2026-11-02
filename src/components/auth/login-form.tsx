// Signs teachers in with their email and password.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export function LoginForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");

    const supabase = createClient();
    const { error: signInError } = await supabase.auth.signInWithPassword({ email, password });

    if (signInError) {
      setError("Those sign-in details were not recognized. Try again.");
      setPending(false);
      return;
    }

    router.replace("/dashboard");
    router.refresh();
  }

  return (
    <form className="space-y-5" onSubmit={handleSubmit}>
      <label className="block space-y-2 text-sm font-medium">
        <span>Email address</span>
        <input
          className="h-12 w-full rounded-md border border-[#d8ded7] bg-white px-3 outline-none transition focus:border-[#527264] focus:ring-2 focus:ring-[#527264]/15"
          type="email"
          autoComplete="email"
          required
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
      </label>
      <label className="block space-y-2 text-sm font-medium">
        <span>Password</span>
        <input
          className="h-12 w-full rounded-md border border-[#d8ded7] bg-white px-3 outline-none transition focus:border-[#527264] focus:ring-2 focus:ring-[#527264]/15"
          type="password"
          autoComplete="current-password"
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && <p className="text-sm text-[#a3332d]" role="alert">{error}</p>}
      <button
        className="h-12 w-full rounded-md bg-[#183d31] px-4 font-semibold text-white transition hover:bg-[#245541] disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Signing in..." : "Sign in"}
      </button>
    </form>
  );
}