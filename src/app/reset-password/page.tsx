"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FeedbackState = {
  kind: "success" | "error" | "info";
  message: string;
} | null;

export default function ResetPasswordPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [mode, setMode] = useState<"request" | "update">("request");
  const [isPending, setIsPending] = useState(false);
  const [feedback, setFeedback] = useState<FeedbackState>(null);

  useEffect(() => {
    const client = getSupabaseBrowserClient();

    if (!client) {
      return;
    }

    void (async () => {
      const {
        data: { session },
      } = await client.auth.getSession();

      if (session) {
        setMode("update");
      }
    })();
  }, []);

  const handleRequestReset = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = getSupabaseBrowserClient();

    if (!client) {
      setFeedback({ kind: "error", message: "Supabase Auth 尚未設定完成" });
      return;
    }

    setIsPending(true);
    setFeedback(null);

    const redirectTo =
      typeof window !== "undefined"
        ? `${window.location.origin}/auth/callback?next=/reset-password`
        : undefined;

    const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
      redirectTo,
    });

    setIsPending(false);

    if (error) {
      setFeedback({ kind: "error", message: error.message });
      return;
    }

    setFeedback({
      kind: "success",
      message: "若此 Email 存在，系統已寄出重設密碼連結。",
    });
  };

  const handleUpdatePassword = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const client = getSupabaseBrowserClient();

    if (!client) {
      setFeedback({ kind: "error", message: "Supabase Auth 尚未設定完成" });
      return;
    }

    setIsPending(true);
    setFeedback(null);

    const { error } = await client.auth.updateUser({
      password,
    });

    setIsPending(false);

    if (error) {
      setFeedback({ kind: "error", message: error.message });
      return;
    }

    setFeedback({
      kind: "success",
      message: "密碼已更新，現在可以回到登入頁使用新密碼登入。",
    });
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10 sm:px-6">
      <section className="mx-auto max-w-md rounded-[32px] border border-line bg-card p-6 shadow-sm sm:p-8">
        <p className="text-sm font-semibold tracking-[0.24em] text-accent">
          LINE CARD STUDIO
        </p>
        <h1 className="mt-3 text-3xl font-semibold text-foreground">重設密碼</h1>
        <p className="mt-3 text-sm leading-7 text-muted">
          這裡先提供最小可用流程骨架：可寄送重設信，也可在 callback 後更新密碼。
        </p>

        {mode === "request" ? (
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleRequestReset(event)}>
            <label className="block">
              <span className="text-sm font-medium text-foreground">Email</span>
              <input
                type="email"
                required
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                placeholder="you@example.com"
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "寄送中..." : "寄送重設連結"}
            </button>
          </form>
        ) : (
          <form className="mt-6 space-y-4" onSubmit={(event) => void handleUpdatePassword(event)}>
            <label className="block">
              <span className="text-sm font-medium text-foreground">新密碼</span>
              <input
                type="password"
                required
                minLength={6}
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                placeholder="至少 6 碼"
              />
            </label>
            <button
              type="submit"
              disabled={isPending}
              className="inline-flex min-h-12 w-full items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isPending ? "更新中..." : "更新密碼"}
            </button>
          </form>
        )}

        {feedback ? (
          <p className={`mt-4 text-sm ${feedback.kind === "error" ? "text-red-600" : "text-accent"}`}>
            {feedback.message}
          </p>
        ) : null}

        <div className="mt-6">
          <Link href="/login" className="text-sm font-semibold text-accent">
            返回登入
          </Link>
        </div>
      </section>
    </main>
  );
}
