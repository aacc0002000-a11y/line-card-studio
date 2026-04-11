"use client";

import Link from "next/link";
import { CardPreview } from "@/components/card/CardPreview";
import { ShareActions } from "@/components/share/ShareActions";
import { buildPublicCardDescription, getThemeName } from "@/lib/card/mapper";
import { shouldShowWatermark } from "@/lib/plans/features";
import type { SavedCardRecord } from "@/lib/card/types";

export function PublicCardPageClient({
  record,
  publicUrl,
}: {
  record: SavedCardRecord;
  publicUrl: string;
}) {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-6xl">
        <header className="rounded-[32px] border border-line bg-card px-6 py-7 shadow-sm">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <p className="text-sm font-semibold tracking-[0.24em] text-accent">
                LINE CARD STUDIO
              </p>
              <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
                {record.cardName}
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
                {buildPublicCardDescription(record)}
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Link
                href="/"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
              >
                返回首頁
              </Link>
            </div>
          </div>
          <div className="mt-4 flex flex-wrap gap-3 text-sm text-muted">
            <span>{record.data.displayName}</span>
            <span>{record.data.jobTitle}</span>
            <span>{record.data.companyName}</span>
            <span>{getThemeName(record.data.themeKey)}</span>
          </div>
        </header>

        <section className="mt-6 rounded-[28px] border border-line bg-card p-4 shadow-sm sm:p-5">
          <div className="mx-auto max-w-[760px]">
            <CardPreview
              data={record.data}
              showWatermark={shouldShowWatermark(record.ownerPlanKey)}
            />
          </div>
        </section>

        <section className="mt-6">
          <ShareActions record={record} publicUrl={publicUrl} />
        </section>
      </div>
    </main>
  );
}
