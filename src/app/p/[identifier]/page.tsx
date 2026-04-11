import type { Metadata } from "next";
import { PublicCardPageClient } from "@/components/card/PublicCardPageClient";
import { EmptyState } from "@/components/cards/EmptyState";
import {
  buildPublicCardMetadata,
  getPublicCardPath,
  getPublishedCardByIdentifier,
} from "@/lib/card/publishing";
import { getPublicPageUrl } from "@/lib/share/helpers";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ identifier: string }>;
}): Promise<Metadata> {
  const { identifier } = await params;
  const record = await getPublishedCardByIdentifier(identifier);
  const publicUrl = getPublicPageUrl(record ? getPublicCardPath(record) : getPublicCardPath(identifier));

  if (!record) {
    return {
      title: "找不到已發佈名片",
      description: "這張名片尚未發佈，或公開資料不存在。",
      alternates: {
        canonical: publicUrl,
      },
      openGraph: {
        title: "找不到已發佈名片",
        description: "這張名片尚未發佈，或公開資料不存在。",
        url: publicUrl,
        type: "website",
      },
    };
  }

  const meta = buildPublicCardMetadata(record);

  return {
    title: meta.title,
    description: meta.description,
    alternates: {
      canonical: publicUrl,
    },
    openGraph: {
      title: meta.title,
      description: meta.description,
      url: publicUrl,
      type: "profile",
      images: record.data.coverUrl ? [record.data.coverUrl] : [],
    },
    twitter: {
      card: record.data.coverUrl ? "summary_large_image" : "summary",
      title: meta.title,
      description: meta.description,
      images: record.data.coverUrl ? [record.data.coverUrl] : [],
    },
  };
}

export default async function PublicCardPage({
  params,
}: {
  params: Promise<{ identifier: string }>;
}) {
  const { identifier } = await params;
  const record = await getPublishedCardByIdentifier(identifier);
  const publicUrl = getPublicPageUrl(record ? getPublicCardPath(record) : getPublicCardPath(identifier));

  if (!record) {
    return (
      <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-4xl">
          <EmptyState
            title="找不到這張公開名片"
            description="這張名片可能尚未發佈、已回到草稿，或公開資料不存在。"
            actionLabel="返回首頁"
            actionHref="/"
          />
        </div>
      </main>
    );
  }

  return <PublicCardPageClient record={record} publicUrl={publicUrl} />;
}
