"use client";

import { copyTextToClipboard } from "@/lib/share/helpers";

export function CopyLinkButton({
  url,
  onStatus,
}: {
  url: string;
  onStatus: (status: { kind: "success" | "error" | "info"; message: string }) => void;
}) {
  const handleCopy = async () => {
    try {
      await copyTextToClipboard(url);
      onStatus({ kind: "success", message: "公開網址已複製。" });
    } catch {
      onStatus({ kind: "error", message: "無法複製網址，請手動複製瀏覽器網址列。" });
    }
  };

  return (
    <button
      type="button"
      onClick={() => void handleCopy()}
      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
    >
      複製連結
    </button>
  );
}
