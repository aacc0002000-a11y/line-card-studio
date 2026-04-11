"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

export function LogoutButton({ className = "" }: { className?: string }) {
  const router = useRouter();
  const [isPending, setIsPending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogout = async () => {
    const client = getSupabaseBrowserClient();

    if (!client) {
      setError("Supabase Auth 尚未設定完成");
      return;
    }

    setIsPending(true);
    setError(null);

    const { error: signOutError } = await client.auth.signOut();

    if (signOutError) {
      setError(signOutError.message);
      setIsPending(false);
      return;
    }

    router.replace("/login");
    router.refresh();
  };

  return (
    <div className="space-y-2">
      <button
        type="button"
        onClick={() => void handleLogout()}
        disabled={isPending}
        className={`inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70 ${className}`}
      >
        {isPending ? "登出中..." : "登出"}
      </button>
      {error ? <p className="text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
