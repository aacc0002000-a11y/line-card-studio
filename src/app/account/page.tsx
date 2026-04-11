import Link from "next/link";
import { ProfileForm } from "@/components/account/ProfileForm";
import { BillingStatusCard } from "@/components/billing/BillingStatusCard";
import { CurrentPlanSummary } from "@/components/billing/CurrentPlanSummary";
import { UpgradeFlowStatus } from "@/components/billing/UpgradeFlowStatus";
import { UpgradePlanCard } from "@/components/billing/UpgradePlanCard";
import { LogoutButton } from "@/components/auth/LogoutButton";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { MemberPlanBadge } from "@/components/dashboard/MemberPlanBadge";
import { requireAuthenticatedMember } from "@/lib/auth/guards";
import { getCurrentBillingOverview } from "@/lib/billing/status";
import { getPlanConfig } from "@/lib/plans/config";

export default async function AccountPage() {
  const { profile } = await requireAuthenticatedMember();
  const plan = getPlanConfig(profile?.planKey);
  const billingOverview = await getCurrentBillingOverview();

  return (
    <DashboardShell
      title="帳號設定"
      description="第一版先提供基本會員資訊與方案欄位預留，後續可在這裡延伸會員制與升級流程。"
      profile={profile}
    >
      <section className="grid gap-6 lg:grid-cols-2">
        <article className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
          <h2 className="text-xl font-semibold text-foreground">會員資料</h2>
          {profile ? <ProfileForm profile={profile} /> : null}
        </article>

        <article className="space-y-6">
          <div className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-xl font-semibold text-foreground">目前方案</h2>
              <MemberPlanBadge planKey={profile?.planKey || "free"} />
            </div>
            <p className="mt-3 text-sm leading-7 text-muted">
              若需要更多名片額度、進階分享或正式可用的 custom slug，可前往升級方案頁查看。
            </p>
            <div className="mt-5">
              <UpgradePlanCard plan={plan} isCurrent currentPlan={profile?.planKey || "free"} />
            </div>
            <div className="mt-5 grid gap-3">
              <Meta label="plan_key" value={profile?.planKey || "free"} />
              <Meta label="billing_status" value={profile?.billingStatus || "inactive"} />
              <Meta label="slug 權益" value={plan.customSlug ? "可自訂 custom slug" : "僅系統自動 slug"} />
            </div>
            <Link
              href="/upgrade"
              className="mt-4 inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
            >
              查看全部方案
            </Link>
          </div>
          <BillingStatusCard overview={billingOverview} title="帳務與方案摘要" />
          <UpgradeFlowStatus overview={billingOverview} />
          <CurrentPlanSummary profile={profile} />

          <div className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
            <h2 className="text-xl font-semibold text-foreground">登入狀態</h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            目前帳號已通過 Supabase Auth 驗證。若要切換帳號，可直接登出後重新登入。
          </p>
          <div className="mt-6">
            <LogoutButton className="w-full" />
          </div>
          </div>
        </article>
      </section>
    </DashboardShell>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
