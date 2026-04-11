import type { BillingOverview } from "@/lib/billing/types";
import { getPlanConfig } from "@/lib/plans/config";
import { getFeatureGate } from "@/lib/plans/guards";

export function BillingStatusCard({
  overview,
  title = "Billing 狀態",
}: {
  overview: BillingOverview | null;
  title?: string;
}) {
  const plan = getPlanConfig(overview?.currentPlan);
  const featureGate = getFeatureGate(overview?.currentPlan);

  return (
    <article className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
      <h2 className="text-xl font-semibold text-foreground">{title}</h2>
      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Stat label="目前方案" value={plan.label} />
        <Stat label="billing_status" value={overview?.billingStatus || "inactive"} />
        <Stat label="自訂 slug 權益" value={featureGate.customSlug ? "Pro 可自訂" : "系統自動 slug"} />
        <Stat
          label="升級流程"
          value={overview?.isUpgradeInProgress ? overview.flowTitle : "目前沒有進行中的流程"}
        />
      </div>
      <p className="mt-4 text-sm leading-7 text-muted">
        owner_plan_key 採卡片快照策略。公開頁與浮水印權益以卡片快照為準，升級完成後再同步既有卡片。
      </p>
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
