import { cardContent } from "@/data/card";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
type LiffInstance = (typeof import("@line/liff"))["default"];
type ShareResult = Awaited<ReturnType<LiffInstance["shareTargetPicker"]>>;

let liffInstancePromise: Promise<LiffInstance | null> | null = null;
let hasInitialized = false;

const TEMPORARY_QUERY_KEYS = new Set([
  "access_token",
  "context_token",
  "id_token",
  "code",
  "state",
  "liff.state",
  "liff.referrer",
  "liffId",
  "liff_id",
  "liffRedirectUri",
  "redirect_uri",
  "is_liff_external_open_window",
  "openExternalBrowser",
  "fbclid",
  "gclid",
  "igshid",
  "mc_cid",
  "mc_eid",
  "nonce",
  "session",
  "session_id",
  "token",
]);

const PLACEHOLDER_PHOTO_SRC = "/card-photo-placeholder.svg";

function isTemporaryLiffParam(key: string) {
  const normalizedKey = key.trim();
  const lowerKey = normalizedKey.toLowerCase();

  return (
    TEMPORARY_QUERY_KEYS.has(normalizedKey) ||
    TEMPORARY_QUERY_KEYS.has(lowerKey) ||
    lowerKey.startsWith("liff.") ||
    lowerKey.includes("context_token") ||
    lowerKey.includes("access_token") ||
    lowerKey.endsWith("_token") ||
    lowerKey.endsWith("_session")
  );
}

function sanitizeUrl(input: string) {
  try {
    const url = new URL(input);

    for (const key of [...url.searchParams.keys()]) {
      if (isTemporaryLiffParam(key)) {
        url.searchParams.delete(key);
      }
    }

    url.hash = "";

    return url.toString();
  } catch {
    return "";
  }
}

function getOriginAndPathnameUrl() {
  if (typeof window === "undefined") {
    return "";
  }

  return `${window.location.origin}${window.location.pathname}`;
}

function getBaseUrl() {
  const sanitizedSiteUrl = sanitizeUrl(SITE_URL || "");

  if (sanitizedSiteUrl) {
    return sanitizedSiteUrl;
  }

  return sanitizeUrl(getOriginAndPathnameUrl()) || getOriginAndPathnameUrl();
}

function toAbsoluteUrl(pathOrUrl: string, baseUrl: string) {
  try {
    return new URL(pathOrUrl, baseUrl).toString();
  } catch {
    return baseUrl;
  }
}

function truncateText(text: string, maxLength: number) {
  if (text.length <= maxLength) {
    return text;
  }

  return `${text.slice(0, maxLength - 1)}…`;
}

async function loadLiff() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!liffInstancePromise) {
    liffInstancePromise = import("@line/liff")
      .then((module) => module.default)
      .catch(() => null);
  }

  return liffInstancePromise;
}

export async function initLiffIfAvailable() {
  if (!LIFF_ID || typeof window === "undefined") {
    return null;
  }

  try {
    const liff = await loadLiff();

    if (!liff) {
      return null;
    }

    if (!hasInitialized) {
      await liff.init({ liffId: LIFF_ID });
      hasInitialized = true;
    }

    return liff;
  } catch {
    return null;
  }
}

export async function getCleanShareUrl() {
  const liff = await initLiffIfAvailable();
  const currentUrl = typeof window === "undefined" ? "" : window.location.href;
  const sanitizedCurrentUrl = sanitizeUrl(currentUrl);

  // Never share window.location.href directly in LIFF.
  // LINE may append temporary auth and context parameters that should not be
  // exposed in chat messages or copied by end users.
  if (liff?.permanentLink?.createUrlBy && sanitizedCurrentUrl) {
    try {
      const permanentUrl = await liff.permanentLink.createUrlBy(
        sanitizedCurrentUrl,
      );

      return sanitizeUrl(permanentUrl) || sanitizedCurrentUrl;
    } catch {
      // Fall through to the stable site URL / origin fallback.
    }
  }

  const sanitizedSiteUrl = getBaseUrl();

  if (sanitizedSiteUrl) {
    return sanitizedSiteUrl;
  }

  return sanitizeUrl(getOriginAndPathnameUrl()) || getOriginAndPathnameUrl();
}

function shouldIncludeHeroImage() {
  return Boolean(
    cardContent.photoSrc &&
      cardContent.photoSrc !== PLACEHOLDER_PHOTO_SRC &&
      !cardContent.photoSrc.includes("placeholder"),
  );
}

function buildBulletRow(text: string) {
  return {
    type: "box" as const,
    layout: "baseline" as const,
    spacing: "sm" as const,
    contents: [
      {
        type: "text" as const,
        text: "•",
        size: "sm" as const,
        color: "#0F766E",
        flex: 0,
      },
      {
        type: "text" as const,
        text,
        size: "sm" as const,
        color: "#172033",
        wrap: true,
        flex: 1,
      },
    ],
  };
}

export function buildShareTextMessage() {
  return {
    type: "text" as const,
    text: "LIFF 分享測試成功",
  };
}

export async function buildMinimalFlexMessage() {
  const cleanUrl = await getCleanShareUrl();

  return {
    type: "flex" as const,
    altText: "SHUANG MU LIN 電子名片",
    contents: {
      type: "bubble" as const,
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "md" as const,
        contents: [
          {
            type: "text" as const,
            text: "SHUANG MU LIN",
            size: "xs" as const,
            color: "#0F766E",
            weight: "bold" as const,
            letterSpacing: "2px",
          },
          {
            type: "text" as const,
            text: "讓LINE變會賺錢好員工",
            size: "xl" as const,
            weight: "bold" as const,
            color: "#172033",
            wrap: true,
          },
          {
            type: "text" as const,
            text: "老闆營運的好夥伴－晏珊",
            size: "sm" as const,
            color: "#5F6B84",
            wrap: true,
          },
        ],
        paddingAll: "20px",
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        contents: [
          {
            type: "button" as const,
            style: "primary" as const,
            color: "#0F766E",
            action: {
              type: "uri" as const,
              label: "查看完整電子名片",
              uri: cleanUrl,
            },
          },
        ],
        paddingAll: "20px",
      },
    },
  };
}

export async function buildBusinessCardFlexMessage() {
  const cleanUrl = await getCleanShareUrl();
  const baseUrl = getBaseUrl() || cleanUrl;
  const bulletPreview = cardContent.bullets.slice(0, 3);
  const bubbleContents = [
    {
      type: "text" as const,
      text: cardContent.brandEn,
      size: "xs" as const,
      color: "#0F766E",
      weight: "bold" as const,
      letterSpacing: "2px",
    },
    {
      type: "text" as const,
      text: cardContent.heroTitle,
      size: "xl" as const,
      weight: "bold" as const,
      color: "#172033",
      wrap: true,
    },
    {
      type: "text" as const,
      text: cardContent.displayName,
      size: "sm" as const,
      color: "#5F6B84",
      wrap: true,
    },
    {
      type: "separator" as const,
      margin: "md" as const,
      color: "#E3E8F2",
    },
    {
      type: "text" as const,
      text: truncateText(cardContent.intro, 88),
      size: "sm" as const,
      color: "#172033",
      wrap: true,
    },
    ...bulletPreview.map(buildBulletRow),
  ];

  if (shouldIncludeHeroImage()) {
    const heroImageUrl = toAbsoluteUrl(cardContent.photoSrc, baseUrl);

    return {
      type: "flex" as const,
      altText: `${cardContent.displayName} 的 LINE 電子名片`,
      contents: {
        type: "bubble" as const,
        hero: {
          type: "image" as const,
          url: heroImageUrl,
          size: "full" as const,
          aspectRatio: "20:13" as const,
          aspectMode: "cover" as const,
        },
        body: {
          type: "box" as const,
          layout: "vertical" as const,
          spacing: "md" as const,
          contents: bubbleContents,
          paddingAll: "20px",
          backgroundColor: "#FFFFFF",
        },
        footer: {
          type: "box" as const,
          layout: "vertical" as const,
          contents: [
            {
              type: "button" as const,
              style: "primary" as const,
              color: "#0F766E",
              action: {
                type: "uri" as const,
                label: "查看完整電子名片",
                uri: cleanUrl,
              },
            },
          ],
          paddingAll: "20px",
          backgroundColor: "#FFFFFF",
        },
      },
    };
  }

  return {
    type: "flex" as const,
    altText: `${cardContent.displayName} 的 LINE 電子名片`,
    contents: {
      type: "bubble" as const,
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "md" as const,
        contents: bubbleContents,
        paddingAll: "20px",
        backgroundColor: "#FFFFFF",
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        contents: [
          {
            type: "button" as const,
            style: "primary" as const,
            color: "#0F766E",
            action: {
              type: "uri" as const,
              label: "查看完整電子名片",
              uri: cleanUrl,
            },
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#FFFFFF",
      },
    },
  };
}

type ShareExecutionStatus =
  | "success"
  | "cancelled"
  | "error"
  | "unavailable";

type ShareExecutionResult = {
  status: ShareExecutionStatus;
  url: string;
  result?: ShareResult;
  error?: unknown;
};

async function shareMessages(messages: Parameters<LiffInstance["shareTargetPicker"]>[0]) {
  const liff = await initLiffIfAvailable();
  const cleanUrl = await getCleanShareUrl();

  if (!liff || !liff.isInClient()) {
    return {
      status: "unavailable" as const,
      url: cleanUrl,
    };
  }

  try {
    const result = await liff.shareTargetPicker(messages);

    console.log("shareTargetPicker result:", result);

    if (result?.status === "success") {
      return {
        status: "success" as const,
        url: cleanUrl,
        result,
      };
    }

    return {
      status: "cancelled" as const,
      url: cleanUrl,
      result,
    };
  } catch (error) {
    console.error("shareTargetPicker error:", error);

    return {
      status: "error" as const,
      url: cleanUrl,
      error,
    };
  }
}

export async function shareTextViaLiff(): Promise<ShareExecutionResult> {
  return shareMessages([buildShareTextMessage()]);
}

export async function shareMinimalFlexViaLiff(): Promise<ShareExecutionResult> {
  const minimalFlexMessage = await buildMinimalFlexMessage();
  return shareMessages([minimalFlexMessage]);
}

export async function shareCardViaLiff() {
  const flexMessage = await buildBusinessCardFlexMessage();
  return shareMessages([flexMessage]);
}
