import { buildPublicCardDescription } from "@/lib/card/mapper";
import type { CardShareContext, SharePayload } from "@/lib/share/types";

export function getSiteUrl() {
  return process.env.NEXT_PUBLIC_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || "";
}

export function getPublicPageUrl(path: string) {
  const siteUrl = getSiteUrl();

  if (!siteUrl) {
    return path;
  }

  return new URL(path, ensureTrailingSlash(siteUrl)).toString();
}

export function getBrowserShareUrl(fallbackUrl: string) {
  if (typeof window === "undefined") {
    return fallbackUrl;
  }

  return window.location.href || fallbackUrl;
}

export function buildSharePayload({ record, publicUrl }: CardShareContext): SharePayload {
  const title = record.cardName.trim() || `${record.data.displayName} 的電子名片`;
  const text = buildPublicCardDescription(record);

  return {
    title,
    text,
    url: publicUrl,
  };
}

export async function copyTextToClipboard(text: string) {
  if (typeof navigator !== "undefined" && navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text);
    return true;
  }

  if (typeof document === "undefined") {
    throw new Error("目前環境不支援複製功能");
  }

  const textarea = document.createElement("textarea");
  textarea.value = text;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();

  try {
    const copied = document.execCommand("copy");

    if (!copied) {
      throw new Error("複製失敗");
    }

    return true;
  } finally {
    document.body.removeChild(textarea);
  }
}

function ensureTrailingSlash(url: string) {
  return url.endsWith("/") ? url : `${url}/`;
}
