import { cardContent } from "@/data/card";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
type LiffInstance = (typeof import("@line/liff"))["default"];

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
]);

function isTemporaryLiffParam(key: string) {
  const normalizedKey = key.trim();

  return (
    TEMPORARY_QUERY_KEYS.has(normalizedKey) ||
    normalizedKey.startsWith("liff.") ||
    normalizedKey.includes("context_token") ||
    normalizedKey.includes("access_token")
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

export async function buildBusinessCardFlexMessage() {
  const cleanUrl = await getCleanShareUrl();
  const baseUrl = getBaseUrl() || cleanUrl;
  const heroImageUrl = toAbsoluteUrl(cardContent.photoSrc, baseUrl);
  const summaryIntro = truncateText(cardContent.intro, 68);
  const bulletPreview = cardContent.bullets.slice(0, 4);

  return {
    type: "flex" as const,
    altText: `${cardContent.displayName} 的 LINE 電子名片`,
    contents: {
      type: "carousel" as const,
      contents: [
        {
          type: "bubble" as const,
          size: "kilo" as const,
          hero: {
            type: "image" as const,
            url: heroImageUrl,
            size: "full" as const,
            aspectRatio: "1:1" as const,
            aspectMode: "cover" as const,
            backgroundColor: "#EAF1F6",
          },
          body: {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "md" as const,
            contents: [
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
                margin: "sm" as const,
                color: "#E3E8F2",
              },
              {
                type: "text" as const,
                text: summaryIntro,
                size: "sm" as const,
                color: "#172033",
                wrap: true,
              },
            ],
            paddingAll: "20px",
            backgroundColor: "#FFFFFF",
          },
          footer: {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
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
        {
          type: "bubble" as const,
          size: "kilo" as const,
          body: {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "md" as const,
            contents: [
              {
                type: "text" as const,
                text: "我可以協助你",
                size: "lg" as const,
                weight: "bold" as const,
                color: "#172033",
              },
              ...bulletPreview.map((bullet) => ({
                type: "box" as const,
                layout: "horizontal" as const,
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
                    text: bullet,
                    size: "sm" as const,
                    color: "#172033",
                    wrap: true,
                    flex: 1,
                  },
                ],
              })),
            ],
            paddingAll: "20px",
            backgroundColor: "#FFFFFF",
          },
          footer: {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
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
              {
                type: "button" as const,
                style: "secondary" as const,
                color: "#E5F3F1",
                action: {
                  type: "uri" as const,
                  label: "前往 LINE 官方一探究竟",
                  uri: cardContent.links.lineUrl,
                },
              },
            ],
            paddingAll: "20px",
            backgroundColor: "#FFFFFF",
          },
        },
      ],
    },
  };
}

export async function shareCardViaLiff() {
  const liff = await initLiffIfAvailable();
  const cleanUrl = await getCleanShareUrl();

  if (!liff || !liff.isInClient()) {
    return {
      shared: false,
      url: cleanUrl,
    };
  }

  try {
    const flexMessage = await buildBusinessCardFlexMessage();

    // Chat rooms should receive a business-card style Flex Message rather than
    // a raw URL so the shared result looks like a card preview, not a tokenized
    // LIFF link or generic link unfurl.
    const result = await liff.shareTargetPicker([
      flexMessage,
    ]);

    return {
      shared: result !== null,
      url: cleanUrl,
    };
  } catch {
    return {
      shared: false,
      url: cleanUrl,
    };
  }
}
