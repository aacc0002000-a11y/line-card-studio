"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { CardList } from "@/components/cards/CardList";
import { EmptyState } from "@/components/cards/EmptyState";
import type { MemberProfile } from "@/lib/auth/types";
import { cardRepository } from "@/lib/card/repository";
import { useCardRecords } from "@/lib/card/storage";
import { assertCanDuplicateCard } from "@/lib/plans/guards";
import { canCreateCard } from "@/lib/plans/limits";

type FeedbackState = {
  kind: "success" | "error";
  message: string;
} | null;

export function MyCardsPageClient({ profile }: { profile: MemberProfile | null }) {
  const { records, isLoading, error, refresh } = useCardRecords();
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const createGuard = canCreateCard(profile?.planKey, records.length);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(null), 2200);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  const handleDuplicate = async (id: string) => {
    try {
      assertCanDuplicateCard(profile?.planKey, records);
      const record = await cardRepository.duplicate(id);

      if (!record) {
        setFeedback({ kind: "error", message: "複製失敗，找不到原始草稿。" });
        return;
      }

      await refresh();
      setFeedback({ kind: "success", message: "草稿已複製。" });
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message: caughtError instanceof Error ? caughtError.message : "複製失敗。",
      });
    }
  };

  const handleDelete = async (id: string) => {
    const confirmed = window.confirm("確定要刪除這張名片草稿嗎？");

    if (!confirmed) {
      return;
    }

    try {
      const deleted = await cardRepository.delete(id);

      if (!deleted) {
        setFeedback({ kind: "error", message: "刪除失敗，找不到指定草稿。" });
        return;
      }

      await refresh();
      setFeedback({ kind: "success", message: "草稿已刪除。" });
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message: caughtError instanceof Error ? caughtError.message : "刪除失敗。",
      });
    }
  };

  return (
    <div className="space-y-4">
      <section className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">名片使用量</h2>
            <p className="mt-1 text-sm text-muted">
              目前已使用 {records.length} / {createGuard.maxCards >= 999 ? "不限" : createGuard.maxCards} 張名片額度。
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Link
              href="/upgrade"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
            >
              查看升級方案
            </Link>
            {createGuard.allowed ? (
              <Link
                href="/editor"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
              >
                建立新名片
              </Link>
            ) : (
              <button
                type="button"
                disabled
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-500"
              >
                已達方案上限
              </button>
            )}
          </div>
        </div>
        {!createGuard.allowed ? (
          <p className="mt-4 text-sm text-red-600">
            你目前方案的名片數量已達上限，無法再建立或複製新名片，請先升級方案。
          </p>
        ) : null}
      </section>

      {feedback ? (
        <p className={`text-sm ${feedback.kind === "error" ? "text-red-600" : "text-accent"}`}>
          {feedback.message}
        </p>
      ) : null}
      {error ? <p className="text-sm text-red-600">{error}</p> : null}

      {isLoading ? (
        <section className="rounded-[28px] border border-line bg-card px-6 py-10 text-center shadow-sm">
          <p className="text-sm text-muted">正在讀取名片列表...</p>
        </section>
      ) : records.length === 0 ? (
        <EmptyState
          title="目前還沒有已保存的名片"
          description="先到編輯器建立第一張電子名片並按下儲存草稿，之後就會出現在這裡。"
          actionLabel={createGuard.allowed ? "前往編輯器" : "查看升級方案"}
          actionHref={createGuard.allowed ? "/editor" : "/upgrade"}
        />
      ) : (
        <CardList
          records={records}
          onDuplicate={handleDuplicate}
          onDelete={handleDelete}
          disableDuplicate={!createGuard.allowed}
        />
      )}
    </div>
  );
}
