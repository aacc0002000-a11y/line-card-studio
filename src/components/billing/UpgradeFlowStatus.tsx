import Link from "next/link";
import type { BillingOverview } from "@/lib/billing/types";

export function UpgradeFlowStatus({
  overview,
  showUpgradeLink = true,
}: {
  overview: BillingOverview | null;
  showUpgradeLink?: boolean;
}) {
  return (
    <article className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h2 className="text-xl font-semibold text-foreground">升級流程狀態</h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            {overview?.flowDescription || "目前沒有進行中的 checkout placeholder。"}
          </p>
        </div>
        <span className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
          {overview?.checkout?.status || overview?.intent?.status || "idle"}
        </span>
      </div>

      <div className="mt-5 grid gap-3 sm:grid-cols-2">
        <Meta label="目前方案" value={overview?.currentPlan || "free"} />
        <Meta label="目標方案" value={overview?.targetPlan || "尚未選定"} />
        <Meta label="Intent" value={overview?.intent?.status || "none"} />
        <Meta label="Checkout" value={overview?.checkout?.status || "none"} />
      </div>

      {overview?.checkout?.checkoutUrl ? (
        <p className="mt-4 text-sm text-muted">checkout placeholder：{overview.checkout.checkoutUrl}</p>
      ) : null}

      {showUpgradeLink ? (
        <Link
          href="/upgrade"
          className="mt-5 inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
        >
          {overview?.ctaLabel || "前往升級"}
        </Link>
      ) : null}
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-base font-semibold text-foreground">{value}</p>
    </div>
  );
}
