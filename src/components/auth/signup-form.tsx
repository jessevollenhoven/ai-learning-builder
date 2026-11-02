// Creates a teacher account and handles email confirmation when enabled.
"use client";

import { useState, type FormEvent } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";

export function SignupForm() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError("");
    setMessage("");

    const supabase = createClient();
    const { data, error: signUpError } = await supabase.auth.signUp({ email, password });

    if (signUpError) {
      setError("We could not create your account. Check your details and try again.");
      setPending(false);
      return;
    }

    if (!data.session) {
      setMessage("Check your email for a confirmation link to finish creating your account.");
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
          autoComplete="new-password"
          minLength={6}
          required
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
      </label>
      {error && <p className="text-sm text-[#a3332d]" role="alert">{error}</p>}
      {message && <p className="text-sm leading-6 text-[#285c43]" role="status">{message}</p>}
      <button
        className="h-12 w-full rounded-md bg-[#183d31] px-4 font-semibold text-white transition hover:bg-[#245541] disabled:cursor-wait disabled:opacity-60"
        type="submit"
        disabled={pending}
      >
        {pending ? "Creating account..." : "Create account"}
      </button>
    </form>
  );
}