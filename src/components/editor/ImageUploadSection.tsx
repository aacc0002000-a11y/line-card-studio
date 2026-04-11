"use client";

import { ImageField } from "@/components/editor/ImageField";
import { defaultCardProfile } from "@/lib/card/defaults";
import type { CardProfileData } from "@/lib/card/types";

export function ImageUploadSection({
  value,
  onChange,
  cardId,
}: {
  value: CardProfileData;
  onChange: (value: CardProfileData) => void;
  cardId?: string | null;
}) {
  const updateField = (
    key: "avatarUrl" | "logoUrl" | "coverUrl",
    nextValue: string,
  ) => {
    onChange({
      ...value,
      [key]: nextValue,
    });
  };

  return (
    <section className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
      <div>
        <h2 className="text-lg font-semibold text-foreground">圖片設定</h2>
        <p className="mt-1 text-sm text-muted">
          可上傳頭像、Logo 與封面圖。使用 Supabase 模式時會先上傳到 Storage，再把圖片 URL 存進草稿。
        </p>
      </div>

      <div className="mt-5 grid gap-4 lg:grid-cols-3">
        <ImageField
          label="頭像"
          value={value.avatarUrl}
          onChange={(nextValue) => updateField("avatarUrl", nextValue)}
          onReset={() => updateField("avatarUrl", defaultCardProfile.avatarUrl)}
          field="avatar"
          cardId={cardId}
          previewMode="avatar"
        />
        <ImageField
          label="Logo"
          value={value.logoUrl}
          onChange={(nextValue) => updateField("logoUrl", nextValue)}
          onReset={() => updateField("logoUrl", defaultCardProfile.logoUrl)}
          field="logo"
          cardId={cardId}
          previewMode="logo"
        />
        <ImageField
          label="封面圖"
          value={value.coverUrl}
          onChange={(nextValue) => updateField("coverUrl", nextValue)}
          onReset={() => updateField("coverUrl", defaultCardProfile.coverUrl)}
          field="cover"
          cardId={cardId}
          previewMode="cover"
        />
      </div>
    </section>
  );
}
