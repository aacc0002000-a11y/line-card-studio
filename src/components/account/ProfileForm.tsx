"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import type { MemberProfile } from "@/lib/auth/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

type FeedbackState = {
  kind: "success" | "error";
  message: string;
} | null;

export function ProfileForm({ profile }: { profile: MemberProfile }) {
  const router = useRouter();
  const [displayName, setDisplayName] = useState(profile.displayName);
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [isPending, setIsPending] = useState(false);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const client = getSupabaseBrowserClient();

    if (!client) {
      setFeedback({
        kind: "error",
        message: "Supabase Auth 尚未設定完成",
      });
      return;
    }

    setIsPending(true);
    setFeedback(null);

    const normalizedDisplayName = displayName.trim();
    const { error } = await client
      .from("profiles")
      .update({
        display_name: normalizedDisplayName,
      })
      .eq("id", profile.id);

    if (error) {
      setFeedback({
        kind: "error",
        message: error.message,
      });
      setIsPending(false);
      return;
    }

    const { error: metadataError } = await client.auth.updateUser({
      data: {
        display_name: normalizedDisplayName,
      },
    });

    if (metadataError) {
      setFeedback({
        kind: "error",
        message: metadataError.message,
      });
      setIsPending(false);
      return;
    }

    setFeedback({
      kind: "success",
      message: "會員資料已更新。",
    });
    setIsPending(false);
    router.refresh();
  };

  return (
    <form className="mt-5 grid gap-3" onSubmit={(event) => void handleSubmit(event)}>
      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-muted">Email</span>
        <input
          type="email"
          value={profile.email}
          readOnly
          className="mt-2 w-full rounded-2xl border border-line bg-[#f8fafc] px-4 py-3 text-sm text-muted outline-none"
        />
      </label>

      <label className="block">
        <span className="text-[11px] font-semibold tracking-[0.16em] text-muted">Display Name</span>
        <input
          type="text"
          value={displayName}
          onChange={(event) => setDisplayName(event.target.value)}
          className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
        />
      </label>

      <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
        <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">Plan Key</p>
        <p className="mt-2 text-sm font-medium text-foreground">{profile.planKey}</p>
      </div>

      {feedback ? (
        <p className={`text-sm ${feedback.kind === "error" ? "text-red-600" : "text-accent"}`}>
          {feedback.message}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={isPending}
        className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {isPending ? "儲存中..." : "儲存會員資料"}
      </button>
    </form>
  );
}
