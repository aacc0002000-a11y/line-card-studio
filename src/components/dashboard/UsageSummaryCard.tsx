import Link from "next/link";

export function UsageSummaryCard({
  usedCards,
  maxCards,
  publishedCards,
  draftCards,
  isNearLimit,
  canCreateMore,
}: {
  usedCards: number;
  maxCards: number;
  publishedCards: number;
  draftCards: number;
  isNearLimit: boolean;
  canCreateMore: boolean;
}) {
  return (
    <article className="rounded-[28px] border border-line bg-card p-6 shadow-sm">
      <div className="flex items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold tracking-[0.18em] text-muted">USAGE</p>
          <h2 className="mt-2 text-xl font-semibold text-foreground">使用量摘要</h2>
        </div>
        <Link
          href="/upgrade"
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
        >
          升級方案
        </Link>
      </div>

      <div className="mt-5 grid gap-3">
        <Stat label="名片已用數" value={`${usedCards} / ${maxCards >= 999 ? "不限" : maxCards}`} />
        <Stat label="已發佈數" value={String(publishedCards)} />
        <Stat label="草稿數" value={String(draftCards)} />
      </div>

      {isNearLimit ? (
        <p className="mt-4 text-sm text-amber-700">
          你的名片數量已接近方案上限，若需要再建立新名片，建議先升級方案。
        </p>
      ) : null}
      {!canCreateMore ? (
        <p className="mt-4 text-sm text-red-600">
          你目前方案的名片數量已達上限，建立與複製新名片都會被限制。
        </p>
      ) : null}
    </article>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-4">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-foreground">{value}</p>
    </div>
  );
}
