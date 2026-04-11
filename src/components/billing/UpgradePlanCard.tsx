"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import { createCheckoutSession } from "@/lib/billing/checkout";
import type { MemberPlanKey } from "@/lib/auth/types";
import type { PlanConfig } from "@/lib/plans/config";

export function UpgradePlanCard({
  plan,
  isCurrent,
  currentPlan,
}: {
  plan: PlanConfig;
  isCurrent?: boolean;
  currentPlan: MemberPlanKey;
}) {
  const router = useRouter();
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isPending, setIsPending] = useState(false);

  const handleIntent = async () => {
    if (isCurrent) {
      setFeedback("你目前已在此方案。");
      return;
    }

    try {
      setIsPending(true);
      setFeedback(null);
      const result = await createCheckoutSession({
        currentPlan,
        targetPlan: plan.key,
      });
      setFeedback(`${result.message} 目前狀態：${result.status}。`);
      router.refresh();
    } catch (caughtError) {
      setFeedback(caughtError instanceof Error ? caughtError.message : "建立 checkout placeholder 失敗。");
    } finally {
      setIsPending(false);
    }
  };

  return (
    <article className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-accent">{plan.key.toUpperCase()}</p>
          <h2 className="mt-2 text-2xl font-semibold text-foreground">{plan.label}</h2>
        </div>
        {isCurrent ? (
          <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
            目前方案
          </span>
        ) : null}
      </div>

      <div className="mt-5 grid gap-2 text-sm text-muted">
        <p>名片上限：{plan.maxCards >= 999 ? "不限" : `${plan.maxCards} 張`}</p>
        <p>模板數量：{plan.allowedTemplates === "all" ? "全部模板" : `${plan.allowedTemplates} 款`}</p>
        <p>移除浮水印：{plan.removeWatermark ? "可用" : "未開放"}</p>
        <p>進階分享：{plan.advancedShare ? "可用" : "未開放"}</p>
        <p>自訂網址：{plan.customSlug ? "可用" : "未開放"}</p>
      </div>

      <button
        type="button"
        onClick={() => void handleIntent()}
        disabled={isPending}
        className="mt-6 inline-flex min-h-11 w-full items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
      >
        {isCurrent ? "目前方案" : isPending ? "建立 checkout..." : "升級至此方案"}
      </button>
      {feedback ? <p className="mt-3 text-sm text-accent">{feedback}</p> : null}
    </article>
  );
}
