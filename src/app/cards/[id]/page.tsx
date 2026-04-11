import Link from "next/link";
import { CardPreview } from "@/components/card/CardPreview";
import { EmptyState } from "@/components/cards/EmptyState";
import { DashboardShell } from "@/components/dashboard/DashboardShell";
import {
  formatCardDateTime,
  getStatusBadgeClassName,
  getStatusLabel,
  getTemplateName,
  getThemeName,
} from "@/lib/card/mapper";
import { cardRepository } from "@/lib/card/repository";
import { requireAuthenticatedMember } from "@/lib/auth/guards";
import { getPublicCardPath } from "@/lib/card/publishing";

export default async function CardDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const { profile } = await requireAuthenticatedMember();
  const record = await cardRepository.getById(id);

  if (!record) {
    return (
      <DashboardShell
        title="名片預覽"
        description="後台只會顯示你自己的名片。若看不到，代表該名片不存在或不屬於目前帳號。"
        profile={profile}
      >
        <EmptyState
          title="找不到這張名片"
          description="這筆資料可能尚未保存、已被刪除，或不屬於目前登入的帳號。"
          actionLabel="返回我的名片"
          actionHref="/my-cards"
        />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell
      title={record.cardName}
      description="這是後台管理視角，可確認目前草稿與已發佈內容。"
      profile={profile}
    >
      <div className="grid gap-6 xl:grid-cols-[minmax(280px,0.38fr)_minmax(0,0.62fr)]">
        <aside className="space-y-4">
          <section className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
            <div className="flex flex-wrap gap-3">
              <Link
                href={`/editor?cardId=${record.id}`}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
              >
                進入編輯
              </Link>
              <Link
                href="/my-cards"
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
              >
                返回列表
              </Link>
              {record.status === "published" ? (
                <Link
                  href={getPublicCardPath(record)}
                  className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:-translate-y-0.5"
                >
                  查看公開頁
                </Link>
              ) : null}
            </div>

            <h2 className="mt-5 text-lg font-semibold text-foreground">名片資訊</h2>
            <div className="mt-4 grid gap-3">
              <Meta label="名片名稱" value={record.cardName} />
              <Meta
                label="狀態"
                value={getStatusLabel(record.status)}
                toneClassName={getStatusBadgeClassName(record.status)}
              />
              <Meta label="最後更新" value={formatCardDateTime(record.updatedAt)} />
              <Meta label="模板" value={getTemplateName(record.data.templateKey)} />
              <Meta label="色系" value={getThemeName(record.data.themeKey)} />
              <Meta label="slug" value={record.slug || "尚未建立"} />
            </div>
          </section>
        </aside>

        <section className="rounded-[28px] border border-line bg-card p-4 shadow-sm sm:p-5">
          <CardPreview data={record.data} />
        </section>
      </div>
    </DashboardShell>
  );
}

function Meta({
  label,
  value,
  toneClassName,
}: {
  label: string;
  value: string;
  toneClassName?: string;
}) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">{label}</p>
      <p className={`mt-1 text-sm font-medium text-foreground ${toneClassName || ""}`}>
        {value}
      </p>
    </div>
  );
}
