"use client";

import {
  shareCardViaCurrentChat,
  shareCardViaTargetPicker,
} from "@/lib/liff/share";
import { canUseAdvancedShare } from "@/lib/plans/features";
import type { SavedCardRecord } from "@/lib/card/types";
import type { LiffShareMode } from "@/lib/liff/types";

export function LineShareButton({
  mode,
  record,
  publicUrl,
  onStatus,
}: {
  mode: Extract<LiffShareMode, "sendMessages" | "shareTargetPicker">;
  record: SavedCardRecord;
  publicUrl: string;
  onStatus: (status: { kind: "success" | "error" | "info"; message: string }) => void;
}) {
  const handleShare = async () => {
    if (!canUseAdvancedShare(record.ownerPlanKey)) {
      onStatus({
        kind: "info",
        message: "此進階分享功能僅提供 Starter / Pro 方案，請升級後使用。",
      });
      return;
    }

    const result =
      mode === "sendMessages"
        ? await shareCardViaCurrentChat(record, publicUrl)
        : await shareCardViaTargetPicker(record, publicUrl);

    onStatus({
      kind:
        result.status === "success"
          ? "success"
          : result.status === "cancelled"
            ? "info"
            : result.status === "unavailable"
              ? "info"
              : "error",
      message: result.message,
    });
  };

  return (
    <button
      type="button"
      onClick={() => void handleShare()}
      className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-emerald-200 px-4 py-2.5 text-sm font-semibold text-emerald-700 hover:-translate-y-0.5"
    >
      {mode === "sendMessages" ? "傳到目前聊天室" : "選好友 / 群組分享"}
    </button>
  );
}
