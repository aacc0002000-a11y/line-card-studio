"use client";

import { cardContent } from "@/data/card";
import { getCleanShareUrl, shareCardViaLiff } from "@/lib/liff";
import { useEffect, useState } from "react";

type ActionStatus = {
  kind: "success" | "error";
  message: string;
} | null;

function phoneHref(phone: string) {
  return `tel:${phone.replace(/\s+/g, "")}`;
}

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
}: {
  href: string;
  label: string;
}) {
  return (
    <a
      href={href}
      target={href.startsWith("tel:") ? undefined : "_blank"}
      rel={href.startsWith("tel:") ? undefined : "noreferrer"}
      className="flex min-h-12 items-center justify-center rounded-2xl border border-line bg-card px-4 py-3 text-center text-sm font-medium text-foreground shadow-sm hover:-translate-y-0.5 hover:border-accent hover:text-accent"
    >
      {label}
    </a>
  );
}

export function CardActions() {
  const [status, setStatus] = useState<ActionStatus>(null);
  const [isPending, setIsPending] = useState(false);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timer = window.setTimeout(() => setStatus(null), 2400);

    return () => window.clearTimeout(timer);
  }, [status]);

  const shareOrCopy = async () => {
    setIsPending(true);

    try {
      const { status, url } = await shareCardViaLiff();

      if (status === "success") {
        setStatus({ kind: "success", message: "LINE 電子名片已成功分享" });
        return;
      }

      if (status === "cancelled") {
        setStatus({ kind: "error", message: "你已取消分享，聊天室未送出訊息" });
        return;
      }

      if (status === "unavailable") {
        await copyText(url);
        setStatus({ kind: "success", message: "LIFF 不可用，已改為複製連結" });
        return;
      }

      setStatus({ kind: "error", message: "LIFF 分享失敗，請查看 console 紀錄" });
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
        <ActionLink
          href={cardContent.links.lineUrl}
          label="前往 LINE 官方一探究竟"
        />
        <ActionLink href={cardContent.links.wechatUrl} label="Wechat" />
        <ActionLink href={cardContent.links.facebookUrl} label="Facebook" />
        <ActionLink href={phoneHref(cardContent.links.phone)} label="Phone" />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <button
          type="button"
          onClick={shareOrCopy}
          disabled={isPending}
          className="min-h-12 rounded-2xl bg-accent px-4 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5 hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {isPending ? "處理中..." : "分享給 LINE 好友 / 群組"}
        </button>
        <button
          type="button"
          onClick={copyLink}
          className="min-h-12 rounded-2xl border border-line bg-accent-soft px-4 py-3 text-sm font-semibold text-accent hover:-translate-y-0.5 hover:border-accent"
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
        {status?.message || "若未設定 LIFF ID，分享按鈕會自動退回複製連結。"}
      </p>
    </div>
  );
}
