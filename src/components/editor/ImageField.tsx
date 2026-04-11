/* eslint-disable @next/next/no-img-element */
"use client";

import type { ChangeEvent } from "react";
import { useId, useState } from "react";
import {
  getImagePreviewSrc,
  imageUploadHint,
  persistCardImageFile,
  validateImageFile,
} from "@/lib/card/image";

export function ImageField({
  label,
  value,
  onChange,
  onReset,
  field,
  cardId,
  previewMode = "cover",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  onReset: () => void;
  field: "avatar" | "logo" | "cover";
  cardId?: string | null;
  previewMode?: "avatar" | "logo" | "cover";
}) {
  const inputId = useId();
  const previewSrc = getImagePreviewSrc(value);
  const [message, setMessage] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    const validation = validateImageFile(file);

    if (!validation.valid) {
      setMessage(validation.message);
      event.target.value = "";
      return;
    }

    try {
      setIsUploading(true);
      const persistedValue = await persistCardImageFile(file, {
        field,
        cardId: cardId || undefined,
      });
      onChange(persistedValue);
      setMessage("圖片已更新。");
    } catch (caughtError) {
      setMessage(
        caughtError instanceof Error ? caughtError.message : "讀取圖片失敗，請再試一次。",
      );
    } finally {
      setIsUploading(false);
      event.target.value = "";
    }
  };

  const handleClear = () => {
    onChange("");
    setMessage("圖片已清除。");
  };

  const previewClassName =
    previewMode === "avatar"
      ? "h-28 w-24 rounded-[22px] object-cover"
      : previewMode === "logo"
        ? "h-16 w-16 rounded-2xl object-contain p-2"
        : "h-32 w-full rounded-[22px] object-cover";

  return (
    <div className="rounded-[24px] border border-line bg-white p-4 shadow-sm">
      <div>
        <h3 className="text-sm font-semibold text-foreground">{label}</h3>
        <p className="mt-1 text-xs text-muted">{imageUploadHint}</p>
      </div>

      <div className="mt-4">
        {previewSrc ? (
          <img
            src={previewSrc}
            alt={`${label} preview`}
            className={previewClassName}
          />
        ) : (
          <div
            className={`flex items-center justify-center rounded-[22px] border border-dashed border-line bg-[#f8fafc] text-center text-xs font-semibold tracking-[0.16em] text-muted ${
              previewMode === "avatar"
                ? "h-28 w-24"
                : previewMode === "logo"
                  ? "h-16 w-16"
                  : "h-32 w-full"
            }`}
          >
            尚未上傳
          </div>
        )}
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <label
          htmlFor={inputId}
          className="inline-flex min-h-11 cursor-pointer items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
        >
          {isUploading ? "上傳中..." : "選擇圖片"}
        </label>
        <button
          type="button"
          onClick={handleClear}
          disabled={isUploading}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          清除圖片
        </button>
        <button
          type="button"
          onClick={onReset}
          disabled={isUploading}
          className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-60"
        >
          使用預設圖
        </button>
        <input
          id={inputId}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          onChange={handleFileChange}
          className="sr-only"
          disabled={isUploading}
        />
      </div>

      {message ? <p className="mt-3 text-sm text-muted">{message}</p> : null}
    </div>
  );
}
