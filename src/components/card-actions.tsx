"use client";

import {
  inspectLiffShareAvailability,
  shareCardViaLiff,
} from "@/lib/liff";
import type { NormalizedCardData } from "@/lib/card-normalize";
import type { CSSProperties } from "react";
import { useEffect, useState } from "react";

type ActionStatus = {
  kind: "success" | "error" | "info";
  message: string;
} | null;

type ShareMode = {
  ready: boolean;
  reason?: string;
};

function ActionLink({
  href,
  label,
  backgroundColor,
  textColor,
}: {
  href: string;
  label: string;
  backgroundColor: string;
  textColor: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") ? undefined : "noreferrer"}
      className="flex min-h-12 items-center justify-center rounded-2xl border border-line px-4 py-3 text-center text-sm font-medium shadow-sm hover:-translate-y-0.5"
      style={{ backgroundColor, color: textColor } as CSSProperties}
    >
      {label}
    </a>
  );
}

export function CardActions({
  card,
}: {
  card: NormalizedCardData;
}) {
  const [status, setStatus] = useState<ActionStatus>(null);
  const [isPending, setIsPending] = useState(false);
  const [isInitializingShare, setIsInitializingShare] = useState(true);
  const [shareMode, setShareMode] = useState<ShareMode>({
    ready: false,
  });

  useEffect(() => {
    if (!status) {
      return;
    }

    const timer = window.setTimeout(() => setStatus(null), 2400);

    return () => window.clearTimeout(timer);
  }, [status]);

  useEffect(() => {
    let isMounted = true;

    setStatus({ kind: "info", message: "正在初始化 LINE 分享..." });

    void (async () => {
      const availability = await inspectLiffShareAvailability();

      if (!isMounted) {
        return;
      }

      if (availability.canShare) {
        setShareMode({
          ready: true,
        });
        setStatus({ kind: "info", message: "LINE 分享已就緒" });
        setIsInitializingShare(false);
        return;
      }

      setShareMode({
        ready: false,
        reason: availability.reason,
      });
      setStatus({
        kind: "error",
        message: `LINE 分享尚未啟用：${availability.reason || "unknown reason"}`,
      });
      setIsInitializingShare(false);
    })();

    return () => {
      isMounted = false;
    };
  }, []);

  const shareToFriends = async () => {
    if (isInitializingShare) {
      setStatus({ kind: "info", message: "正在初始化 LINE 分享..." });
      return;
    }

    setIsPending(true);

    try {
      if (shareMode.ready) {
        const { status, reason } = await shareCardViaLiff(card);

        if (status === "success") {
          setStatus({ kind: "success", message: "LINE 電子名片已成功分享" });
          return;
        }

        if (status === "cancelled") {
          setStatus({ kind: "info", message: "你已取消分享，聊天室未送出訊息" });
          return;
        }

        if (status === "unavailable") {
          setShareMode({
            ready: false,
            reason,
          });
          setStatus({
            kind: "error",
            message: `LINE 分享不可用：${reason || "unknown reason"}`,
          });
          return;
        }

        setStatus({
          kind: "error",
          message: `LIFF 分享失敗：${reason || "shareTargetPicker error"}`,
        });
        return;
      }
      setStatus({
        kind: "info",
        message: `請在 LINE 內開啟以分享：${shareMode.reason || "unknown reason"}`,
      });
    } catch {
      setStatus({ kind: "error", message: "分享失敗，請稍後再試" });
    } finally {
      setIsPending(false);
    }
  };
  const actionButtons = card.buttons.slice(0, 3);
  const shareButtonStyle = card.buttons[3] || {
    label: "分享好友",
    buttonBgColor: card.buttonBgColor,
    buttonTextColor: card.buttonTextColor,
  };

  return (
    <div className="space-y-4">
      <div className="space-y-3">
        {actionButtons.map((button) => (
          <ActionLink
            key={`${button.label}-${button.url}`}
            href={button.url}
            label={button.label}
            backgroundColor={button.buttonBgColor || card.buttonBgColor}
            textColor={button.buttonTextColor || card.buttonTextColor}
          />
        ))}
        <button
          type="button"
          onClick={shareToFriends}
          disabled={isPending || isInitializingShare}
          className="flex min-h-13 w-full items-center justify-center rounded-2xl px-4 py-3.5 text-center text-sm font-semibold shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            backgroundColor:
              shareButtonStyle.buttonBgColor || card.buttonBgColor,
            color: shareButtonStyle.buttonTextColor || card.buttonTextColor,
          }}
        >
          {isPending
            ? "處理中..."
            : isInitializingShare
              ? "正在初始化 LINE 分享"
              : shareButtonStyle.label || "分享好友"}
        </button>
      </div>
      <p
        className={`min-h-6 text-sm ${
          status?.kind === "error" ? "text-red-600" : "text-muted"
        }`}
        aria-live="polite"
      >
        {status?.message || "前 3 顆為聯絡按鈕，最下方固定為分享好友。"}
      </p>
    </div>
  );
}
