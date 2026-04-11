import Link from "next/link";
import type { MemberProfile } from "@/lib/auth/types";
import { getFeatureGate } from "@/lib/plans/guards";
import { getUpgradeReason } from "@/lib/plans/billing";

export function CurrentPlanSummary({ profile }: { profile: MemberProfile | null }) {
  const featureGate = getFeatureGate(profile?.planKey);
  const upgradeReason = getUpgradeReason(profile?.planKey);

  return (
    <article className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">目前方案權益</h2>
      <div className="mt-5 grid gap-2 text-sm text-muted">
        <p>移除浮水印：{featureGate.removeWatermark ? "已開啟" : "免費版顯示平台浮水印"}</p>
        <p>進階分享：{featureGate.advancedShare ? "已開啟" : "僅提供基礎分享"}</p>
        <p>自訂公開識別：{featureGate.customSlug ? "可自訂 slug" : "僅系統自動產生"}</p>
        <p>Priority Support：{featureGate.prioritySupport ? "已開啟" : "未開啟"}</p>
        <p>Billing 狀態：{profile?.billingStatus || "inactive"}</p>
      </div>
      <p className="mt-4 text-sm text-muted">{upgradeReason}</p>
      <Link
        href="/upgrade"
        className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
      >
        查看升級方案
      </Link>
    </article>
  );
}
