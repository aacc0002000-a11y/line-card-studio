import Link from "next/link";
import { CardImage } from "@/components/card/CardImage";
import { getImagePreviewSrc } from "@/lib/card/image";
import {
  formatCardDateTime,
  getStatusBadgeClassName,
  getStatusLabel,
  getTemplateName,
  getThemeName,
} from "@/lib/card/mapper";
import { getPublicCardPath } from "@/lib/card/publishing";
import type { SavedCardRecord } from "@/lib/card/types";

export function CardListItem({
  record,
  onDuplicate,
  onDelete,
  disableDuplicate = false,
}: {
  record: SavedCardRecord;
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  disableDuplicate?: boolean;
}) {
  const thumbnailSrc = getImagePreviewSrc(record.data.avatarUrl) || record.data.coverUrl;
  const publicPath = getPublicCardPath(record);

  return (
    <article className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
      <div className="grid gap-4 lg:grid-cols-[112px_minmax(0,1fr)] lg:items-start">
        <div className="overflow-hidden rounded-[24px] border border-line bg-[#f8fafc]">
          <CardImage
            src={thumbnailSrc}
            alt={`${record.data.displayName} thumbnail`}
            className="h-28 w-full object-cover"
            fallbackLabel="CARD"
          />
        </div>

        <div>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p
                className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(record.status)}`}
              >
                {getStatusLabel(record.status)}
              </p>
              <h2 className="mt-2 text-xl font-semibold text-foreground">
                {record.cardName}
              </h2>
              <p className="mt-1 text-sm text-muted">{record.data.displayName}</p>
            </div>
            <div className="rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
              {getTemplateName(record.data.templateKey)}
            </div>
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
            <Meta label="模板" value={getTemplateName(record.data.templateKey)} />
            <Meta label="色系" value={getThemeName(record.data.themeKey)} />
            <Meta label="更新時間" value={formatCardDateTime(record.updatedAt)} />
            <Meta label="狀態" value={getStatusLabel(record.status)} />
            <Meta label="公開識別" value={record.slug || record.id} />
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <Link
              href={`/editor?cardId=${record.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
            >
              繼續編輯
            </Link>
            <Link
              href={`/cards/${record.id}`}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
            >
              預覽
            </Link>
            {record.status === "published" ? (
              <Link
                href={publicPath}
                className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:-translate-y-0.5"
              >
                公開頁
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => onDuplicate(record.id)}
              disabled={disableDuplicate}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
            >
              複製
            </button>
            <button
              type="button"
              onClick={() => onDelete(record.id)}
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-red-200 px-4 py-2.5 text-sm font-semibold text-red-600 hover:-translate-y-0.5"
            >
              刪除
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">
        {label}
      </p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
