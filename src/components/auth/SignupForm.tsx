"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type SignupState = {
  error: string | null;
  info: string | null;
};

export function SignupForm({ nextPath }: { nextPath: string }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isPending, setIsPending] = useState(false);
  const [state, setState] = useState<SignupState>({
    error: null,
    info: null,
  });

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const client = getSupabaseBrowserClient();

    if (!client) {
      setState({
        error: "Supabase Auth 尚未設定完成",
        info: null,
      });
      return;
    }

    setIsPending(true);
    setState({
      error: null,
      info: null,
    });

    const { data, error } = await client.auth.signUp({
      email: email.trim(),
      password,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    if (error) {
      setState({
        error: error.message,
        info: null,
      });
      setIsPending(false);
      return;
    }

    if (data.session) {
      router.replace(nextPath);
      router.refresh();
      return;
    }

    setState({
      error: null,
      info: "註冊成功。若目前專案有啟用 Email 驗證，請先到信箱完成驗證後再登入。",
    });
    setIsPending(false);
  };

  return (
    <form className="space-y-4" onSubmit={(event) => void handleSubmit(event)}>
      <label className="block">
        <span className="text-sm font-medium text-foreground">顯示名稱</span>
        <input
          type="text"
          required
          autoComplete="name"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          placeholder="王大明"
        />
      </label>

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
          minLength={6}
          autoComplete="new-password"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
          placeholder="至少 6 碼"
        />
      </label>

      {state.error ? <p className="text-sm text-red-600">{state.error}</p> : null}
      {state.info ? <p className="text-sm text-accent">{state.info}</p> : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "註冊中..." : "建立帳號"}
      </button>

      <p className="text-sm text-muted">
        已經有帳號？{" "}
        <Link href="/login" className="font-semibold text-accent">
          直接登入
        </Link>
      </p>
    </form>
  );
}
