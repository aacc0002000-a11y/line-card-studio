import { BillingStatusCard } from "@/components/billing/BillingStatusCard";
import { PlanFeatureTable } from "@/components/billing/PlanFeatureTable";
import { CurrentPlanSummary } from "@/components/billing/CurrentPlanSummary";
import { UpgradeFlowStatus } from "@/components/billing/UpgradeFlowStatus";
import { UpgradePlanCard } from "@/components/billing/UpgradePlanCard";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { requireAuthenticatedMember } from "@/lib/auth/guards";
import { getCurrentBillingOverview } from "@/lib/billing/status";
import { planConfigs } from "@/lib/plans/config";

export default async function UpgradePage() {
  const { profile } = await requireAuthenticatedMember();
  const billingOverview = await getCurrentBillingOverview();

  return (
    <DashboardShell
      title="升級方案"
      description="此頁已從單純 intent 提示，提升為 checkout placeholder 前置流程。此包仍不正式扣款，但已保留 provider 接口。"
      profile={profile}
    >
      <section className="grid gap-6 lg:grid-cols-2">
        <BillingStatusCard overview={billingOverview} title="目前帳務狀態" />
        <UpgradeFlowStatus overview={billingOverview} showUpgradeLink={false} />
      </section>

      <section className="mt-6 grid gap-6 lg:grid-cols-3">
        {Object.values(planConfigs).map((plan) => (
          <UpgradePlanCard
            key={plan.key}
            plan={plan}
            isCurrent={profile?.planKey === plan.key}
            currentPlan={profile?.planKey || "free"}
          />
        ))}
      </section>

      <div className="mt-6">
        <PlanFeatureTable />
      </div>
      <div className="mt-6">
        <CurrentPlanSummary profile={profile} />
      </div>
    </DashboardShell>
  );
}
