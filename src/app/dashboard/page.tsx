import { BillingStatusCard } from "@/components/billing/BillingStatusCard";
import Link from "next/link";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import { CurrentPlanSummary } from "@/components/billing/CurrentPlanSummary";
import { UpgradeFlowStatus } from "@/components/billing/UpgradeFlowStatus";
import { MemberPlanBadge } from "@/components/dashboard/MemberPlanBadge";
import { UsageSummaryCard } from "@/components/dashboard/UsageSummaryCard";
import { requireAuthenticatedMember } from "@/lib/auth/guards";
import { getCurrentBillingOverview } from "@/lib/billing/status";
import { cardRepository } from "@/lib/card/repository";
import { getPlanConfig } from "@/lib/plans/config";
import { getPlanUsageSummary } from "@/lib/plans/usage";

export default async function DashboardPage() {
  const { profile } = await requireAuthenticatedMember();
  const records = await cardRepository.getAll();
  const usage = getPlanUsageSummary(profile?.planKey, records);
  const plan = getPlanConfig(profile?.planKey);
  const billingOverview = await getCurrentBillingOverview();

  return (
    <DashboardShell
      title="會員後台"
      description="這裡是第一版會員系統的管理首頁，可查看方案、名片統計與常用快捷入口。"
      profile={profile}
    >
      <section className="grid gap-6 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
        <article className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.18em] text-accent">WELCOME</p>
          <h2 className="mt-3 text-2xl font-semibold text-foreground">
            {profile?.displayName || "Member"}，歡迎回來
          </h2>
          <p className="mt-3 text-sm leading-7 text-muted">
            目前帳號已完成登入，可建立、編輯、發佈與刪除屬於自己的電子名片。公開頁已改為
            `/p/[identifier]`，可同時相容舊 id 與新的 slug。
          </p>

          <div className="mt-6 flex flex-wrap gap-3">
            {usage.cardLimit.allowed ? (
              <Link
                href="/editor"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
              >
                建立新名片
              </Link>
            ) : (
              <Link
                href="/upgrade"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
              >
                升級方案
              </Link>
            )}
            <Link
              href="/my-cards"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
            >
              我的名片
            </Link>
            <Link
              href="/account"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
            >
              帳號設定
            </Link>
          </div>
        </article>

        <article className="space-y-6">
          <div className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-semibold tracking-[0.18em] text-muted">PLAN</p>
                <h2 className="mt-2 text-xl font-semibold text-foreground">目前方案</h2>
              </div>
              <MemberPlanBadge planKey={profile?.planKey || "free"} />
            </div>

            <div className="mt-5 grid gap-3">
              <StatCard label="方案名稱" value={plan.label} />
              <StatCard
                label="模板額度"
                value={plan.allowedTemplates === "all" ? "全部模板" : `${plan.allowedTemplates} 款`}
              />
              <StatCard
                label="升級狀態"
                value={
                  billingOverview?.isUpgradeInProgress
                    ? billingOverview.flowTitle
                    : usage.cardLimit.allowed
                      ? "仍可建立新名片"
                      : "已達上限，建議升級"
                }
              />
            </div>
          </div>

          <UsageSummaryCard
            usedCards={usage.totalCards}
            maxCards={usage.cardLimit.maxCards}
            publishedCards={usage.publishedCards}
            draftCards={usage.draftCards}
            isNearLimit={usage.isNearLimit}
            canCreateMore={usage.cardLimit.allowed}
          />
          <BillingStatusCard overview={billingOverview} />
          <UpgradeFlowStatus overview={billingOverview} />
          <CurrentPlanSummary profile={profile} />
        </article>
      </section>
    </DashboardShell>
  );
}

function StatCard({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
