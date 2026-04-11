"use client";

import { canUseWebShare } from "@/lib/share/environment";
import type { SharePayload } from "@/lib/share/types";

export function WebShareButton({
  payload,
  onStatus,
}: {
  payload: SharePayload;
  onStatus: (status: { kind: "success" | "error" | "info"; message: string }) => void;
}) {
  if (!canUseWebShare()) {
    return null;
  }

  const handleShare = async () => {
    try {
      await navigator.share(payload);
      onStatus({ kind: "success", message: "已開啟系統分享。" });
    } catch (caughtError) {
      if (caughtError instanceof Error && caughtError.name === "AbortError") {
        onStatus({ kind: "info", message: "已取消分享。" });
        return;
      }

      onStatus({ kind: "error", message: "系統分享失敗，請改用複製連結。" });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="inline-flex min-h-11 items-center justify-center rounded-2xl bg-accent px-4 py-2.5 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
    >
      分享名片
    </button>
  );
}
