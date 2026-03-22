import { cardContent } from "@/data/card";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
type LiffInstance = (typeof import("@line/liff"))["default"];
type ShareResult = Awaited<ReturnType<LiffInstance["shareTargetPicker"]>>;
const SHARE_CARD_IMAGE_SRC = "/share-card-image.svg";

export type LiffDiagnostics = {
  currentUrl: string;
  currentOrigin: string;
  siteUrl: string;
  siteOrigin: string;
  hasLiffId: boolean;
  configuredLiffId: string;
  runtimeLiffId: string;
  initStatus: "idle" | "success" | "failed";
  inClient: boolean | null;
  loggedIn: boolean | null;
  shareTargetPickerAvailable: boolean | null;
  warnings: string[];
  reason?: string;
  errorMessage?: string;
};

export type LiffShareAvailability = {
  canShare: boolean;
  reason?: string;
  diagnostics: LiffDiagnostics;
};

type LiffInitializationResult = {
  liff: LiffInstance | null;
  diagnostics: LiffDiagnostics;
};

type ShareExecutionStatus =
  | "success"
  | "cancelled"
  | "error"
  | "unavailable";

export type ShareExecutionResult = {
  status: ShareExecutionStatus;
  url: string;
  result?: ShareResult;
  error?: unknown;
  reason?: string;
  diagnostics: LiffDiagnostics;
};

let liffInstancePromise: Promise<LiffInstance | null> | null = null;
let liffInitializationPromise: Promise<LiffInitializationResult> | null = null;

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

function getSiteOrigin(siteUrl: string) {
  try {
    return new URL(siteUrl).origin;
  } catch {
    return "";
  }
}

function getClientLocation() {
  if (typeof window === "undefined") {
    return {
      currentUrl: "",
      currentOrigin: "",
    };
  }

  return {
    currentUrl: window.location.href,
    currentOrigin: window.location.origin,
  };
}

function createDiagnostics(): LiffDiagnostics {
  const { currentUrl, currentOrigin } = getClientLocation();
  const siteUrl = SITE_URL || "";
  const siteOrigin = getSiteOrigin(siteUrl);
  const configuredLiffId = LIFF_ID || "";
  const warnings: string[] = [];

  if (siteOrigin && currentOrigin && siteOrigin !== currentOrigin) {
    warnings.push(
      `current origin (${currentOrigin}) does not match NEXT_PUBLIC_SITE_URL origin (${siteOrigin})`,
    );
  }

  return {
    currentUrl,
    currentOrigin,
    siteUrl,
    siteOrigin,
    hasLiffId: Boolean(configuredLiffId),
    configuredLiffId,
    runtimeLiffId: "",
    initStatus: "idle",
    inClient: null,
    loggedIn: null,
    shareTargetPickerAvailable: null,
    warnings,
  };
}

function logDiagnostics(label: string, diagnostics: LiffDiagnostics) {
  console.log(label, {
    currentUrl: diagnostics.currentUrl,
    currentOrigin: diagnostics.currentOrigin,
    siteUrl: diagnostics.siteUrl,
    siteOrigin: diagnostics.siteOrigin,
    hasLiffId: diagnostics.hasLiffId,
    configuredLiffId: diagnostics.configuredLiffId,
    runtimeLiffId: diagnostics.runtimeLiffId,
    initStatus: diagnostics.initStatus,
    inClient: diagnostics.inClient,
    loggedIn: diagnostics.loggedIn,
    shareTargetPickerAvailable: diagnostics.shareTargetPickerAvailable,
    warnings: diagnostics.warnings,
    reason: diagnostics.reason,
    errorMessage: diagnostics.errorMessage,
  });
}

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
      .catch((error) => {
        console.error("Failed to load @line/liff", error);
        return null;
      });
  }

  return liffInstancePromise;
}

async function ensureLiffInitialized(): Promise<LiffInitializationResult> {
  if (!liffInitializationPromise) {
    liffInitializationPromise = (async () => {
      const diagnostics = createDiagnostics();

      console.log("LIFF initialization started");
      logDiagnostics("LIFF environment", diagnostics);

      if (typeof window === "undefined") {
        diagnostics.reason = "window unavailable";
        diagnostics.initStatus = "failed";
        logDiagnostics("LIFF initialization skipped", diagnostics);
        return { liff: null, diagnostics };
      }

      if (!diagnostics.hasLiffId) {
        diagnostics.reason = "missing liffId";
        diagnostics.initStatus = "failed";
        logDiagnostics("LIFF initialization failed", diagnostics);
        return { liff: null, diagnostics };
      }

      const liff = await loadLiff();

      if (!liff) {
        diagnostics.reason = "failed to load @line/liff";
        diagnostics.initStatus = "failed";
        logDiagnostics("LIFF initialization failed", diagnostics);
        return { liff: null, diagnostics };
      }

      try {
        await liff.init({ liffId: diagnostics.configuredLiffId });
        diagnostics.initStatus = "success";
        diagnostics.runtimeLiffId = liff.id || "";
        diagnostics.inClient = liff.isInClient();
        diagnostics.loggedIn = liff.isLoggedIn();
        diagnostics.shareTargetPickerAvailable = liff.isApiAvailable(
          "shareTargetPicker",
        );

        if (
          diagnostics.siteOrigin &&
          diagnostics.currentOrigin &&
          diagnostics.siteOrigin !== diagnostics.currentOrigin
        ) {
          console.warn(
            "LIFF origin warning: current origin differs from NEXT_PUBLIC_SITE_URL origin",
            diagnostics,
          );
        }

        logDiagnostics("LIFF initialization success", diagnostics);
        return { liff, diagnostics };
      } catch (error) {
        diagnostics.initStatus = "failed";
        diagnostics.reason = "liff.init failed";
        diagnostics.errorMessage =
          error instanceof Error ? error.message : String(error);
        logDiagnostics("LIFF initialization failed", diagnostics);
        console.error("liff.init failed", error);
        return { liff: null, diagnostics };
      }
    })();
  }

  return liffInitializationPromise;
}

export async function inspectLiffShareAvailability(): Promise<LiffShareAvailability> {
  const { liff, diagnostics } = await ensureLiffInitialized();

  if (!liff) {
    return {
      canShare: false,
      reason: diagnostics.reason || "liff.init failed",
      diagnostics,
    };
  }

  if (!diagnostics.inClient) {
    diagnostics.reason = "not running inside LINE client";
    logDiagnostics("LIFF share unavailable", diagnostics);
    return {
      canShare: false,
      reason: diagnostics.reason,
      diagnostics,
    };
  }

  if (!diagnostics.shareTargetPickerAvailable) {
    diagnostics.reason = "shareTargetPicker not available";
    logDiagnostics("LIFF share unavailable", diagnostics);
    return {
      canShare: false,
      reason: diagnostics.reason,
      diagnostics,
    };
  }

  diagnostics.reason = undefined;
  logDiagnostics("LIFF share available", diagnostics);

  return {
    canShare: true,
    diagnostics,
  };
}

export async function initLiffIfAvailable() {
  const { liff } = await ensureLiffInitialized();
  return liff;
}

export async function getCleanShareUrl() {
  const { liff } = await ensureLiffInitialized();
  const currentUrl = typeof window === "undefined" ? "" : window.location.href;
  const sanitizedCurrentUrl = sanitizeUrl(currentUrl);

  if (liff?.permanentLink?.createUrlBy && sanitizedCurrentUrl) {
    try {
      const permanentUrl = await liff.permanentLink.createUrlBy(
        sanitizedCurrentUrl,
      );

      return sanitizeUrl(permanentUrl) || sanitizedCurrentUrl;
    } catch (error) {
      console.warn("Failed to create LIFF permanent link", error);
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

export async function buildShareImageMessage() {
  const cleanUrl = await getCleanShareUrl();
  const baseUrl = getBaseUrl() || cleanUrl;
  const imageUrl = toAbsoluteUrl(SHARE_CARD_IMAGE_SRC, baseUrl);

  return {
    type: "image" as const,
    originalContentUrl: imageUrl,
    previewImageUrl: imageUrl,
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

export async function buildShareCardMessages() {
  const imageMessage = await buildShareImageMessage();
  const flexMessage = await buildBusinessCardFlexMessage();

  return [imageMessage, flexMessage] as const;
}

async function shareMessages(
  messages: Parameters<LiffInstance["shareTargetPicker"]>[0],
): Promise<ShareExecutionResult> {
  const availability = await inspectLiffShareAvailability();
  const cleanUrl = await getCleanShareUrl();

  if (!availability.canShare) {
    console.warn("LIFF share fallback", availability);
    return {
      status: "unavailable",
      url: cleanUrl,
      reason: availability.reason,
      diagnostics: availability.diagnostics,
    };
  }

  const liff = await initLiffIfAvailable();

  if (!liff) {
    return {
      status: "unavailable",
      url: cleanUrl,
      reason: "liff.init failed",
      diagnostics: availability.diagnostics,
    };
  }

  try {
    console.log("shareTargetPicker payload:", messages);
    const result = await liff.shareTargetPicker(messages);

    console.log("shareTargetPicker result:", result);

    if (result?.status === "success") {
      return {
        status: "success",
        url: cleanUrl,
        result,
        diagnostics: availability.diagnostics,
      };
    }

    console.log("shareTargetPicker cancelled", {
      reason: "picker closed or no target selected",
    });

    return {
      status: "cancelled",
      url: cleanUrl,
      result,
      diagnostics: availability.diagnostics,
    };
  } catch (error) {
    console.error("shareTargetPicker error:", error);

    return {
      status: "error",
      url: cleanUrl,
      error,
      reason: "shareTargetPicker error",
      diagnostics: availability.diagnostics,
    };
  }
}

export async function shareTextViaLiff(): Promise<ShareExecutionResult> {
  return shareMessages([buildShareTextMessage()]);
}

export async function shareImageViaLiff(): Promise<ShareExecutionResult> {
  const imageMessage = await buildShareImageMessage();
  return shareMessages([imageMessage]);
}

export async function shareMinimalFlexViaLiff(): Promise<ShareExecutionResult> {
  const minimalFlexMessage = await buildMinimalFlexMessage();
  return shareMessages([minimalFlexMessage]);
}

export async function shareCardViaLiff(): Promise<ShareExecutionResult> {
  const messages = await buildShareCardMessages();
  return shareMessages([...messages]);
}
