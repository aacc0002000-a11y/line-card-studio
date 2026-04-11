"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LoginForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const client = getSupabaseBrowserClient();

    if (!client) {
      setError("Supabase Auth 尚未設定完成");
      return;
    }

    setIsPending(true);
    setError(null);

    const { error: signInError } = await client.auth.signInWithPassword({
      email: email.trim(),
      password,
    });

    if (signInError) {
      setError(signInError.message);
      setIsPending(false);
      return;
    }

    router.replace(nextPath);
    router.refresh();
  };

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <label className="block">
        <span className="text-sm font-medium text-foreground">Email</span>
        <input
          type="email"
          required
          autoComplete="email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          placeholder="you@example.com"
        />
      </label>

      <label className="block">
        <span className="text-sm font-medium text-foreground">Password</span>
        <input
          type="password"
          required
          autoComplete="current-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          placeholder="請輸入密碼"
        />
      </label>

      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "登入中..." : "登入"}
      </button>

      <p className="text-sm text-muted">
        還沒有帳號？{" "}
        <Link href="/signup" className="font-semibold text-accent">
          立即註冊
        </Link>
      </p>
      <p className="text-sm text-muted">
        忘記密碼？{" "}
        <Link href="/reset-password" className="font-semibold text-accent">
          重設密碼
        </Link>
      </p>
    </form>
  );
}
