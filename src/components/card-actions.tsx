"use client";

import {
  getCleanShareUrl,
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
  fallbackToCopy: boolean;
  reason?: string;
};

async function copyText(text: string) {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return;
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "absolute";
  textarea.style.left = "-9999px";
  document.body.appendChild(textarea);
  textarea.select();
  document.execCommand("copy");
  document.body.removeChild(textarea);
}

function ActionLink({
  href,
  label,
  accentColor,
}: {
  href: string;
  label: string;
  accentColor: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") ? undefined : "noreferrer"}
      className="flex min-h-12 items-center justify-center rounded-2xl border border-line bg-card px-4 py-3 text-center text-sm font-medium text-foreground shadow-sm hover:-translate-y-0.5"
      style={
        {
          "--link-accent": accentColor,
        } as CSSProperties
      }
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
    fallbackToCopy: false,
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
          fallbackToCopy: false,
        });
        setStatus({ kind: "info", message: "LINE 分享已就緒" });
        setIsInitializingShare(false);
        return;
      }

      setShareMode({
        ready: false,
        fallbackToCopy: true,
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

  const shareOrCopy = async () => {
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
            fallbackToCopy: true,
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

      const cleanUrl = await getCleanShareUrl();

      await copyText(cleanUrl);
      setStatus({
        kind: "info",
        message: `LINE 分享未啟用，已複製連結：${shareMode.reason || "unknown reason"}`,
      });
    } catch {
      setStatus({ kind: "error", message: "分享失敗，請稍後再試" });
    } finally {
      setIsPending(false);
    }
  };

  const copyLink = async () => {
    try {
      const cleanUrl = await getCleanShareUrl();

      await copyText(cleanUrl);
      setStatus({ kind: "success", message: "名片連結已複製" });
    } catch {
      setStatus({ kind: "error", message: "複製失敗，請手動複製網址" });
    }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        {card.buttons.map((button) => (
          <ActionLink
            key={`${button.label}-${button.url}`}
            href={button.url}
            label={button.label}
            accentColor={card.accentColor}
          />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={shareOrCopy}
          disabled={isPending || isInitializingShare}
          className="min-h-12 rounded-2xl px-4 py-3 text-sm font-semibold shadow-sm hover:-translate-y-0.5 disabled:cursor-not-allowed disabled:opacity-70"
          style={{
            backgroundColor: card.buttonBgColor,
            color: card.buttonTextColor,
          }}
        >
          {isPending
            ? "處理中..."
            : isInitializingShare
              ? "正在初始化 LINE 分享"
              : shareMode.ready
                ? "分享給 LINE 好友 / 群組"
                : "複製名片連結（LINE 分享未啟用）"}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="min-h-12 rounded-2xl border border-line bg-accent-soft px-4 py-3 text-sm font-semibold hover:-translate-y-0.5"
          style={{
            color: card.accentColor,
            borderColor: card.accentColor,
          }}
        >
          複製名片連結
        </button>
      </div>
      <p
        className={`min-h-6 text-sm ${
          status?.kind === "error" ? "text-red-600" : "text-muted"
        }`}
        aria-live="polite"
      >
        {status?.message || "LINE 分享初始化完成後，才會啟用真正的分享流程。"}
      </p>
    </div>
  );
}
