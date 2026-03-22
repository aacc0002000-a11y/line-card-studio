import {
  getStaticFallbackCardData,
  type CardButton,
  type NormalizedCardData,
} from "@/lib/card-normalize";

const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;
const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL;
type LiffInstance = (typeof import("@line/liff"))["default"];
type ShareResult = Awaited<ReturnType<LiffInstance["shareTargetPicker"]>>;

type SharePayloadMode =
  | "refined_safe_business_card_bubble"
  | "enhanced_business_card_bubble"
  | "photo_and_4cta_business_card_bubble"
  | "minimal_bubble"
  | "flex_only"
  | "text_and_minimal_flex";
// Default stays on the last known good version. Switch to
// "enhanced_business_card_bubble", "refined_safe_business_card_bubble",
// "minimal_bubble", "flex_only", or "text_and_minimal_flex" for rollback.
const SHARE_PAYLOAD_MODE: SharePayloadMode =
  "photo_and_4cta_business_card_bubble";

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

function getShareAssetUrl(assetPath: string) {
  if (!assetPath) {
    return "";
  }

  if (/^https:\/\//i.test(assetPath)) {
    return sanitizeUrl(assetPath) || assetPath;
  }

  const baseUrl = getBaseUrl();

  if (!baseUrl) {
    return "";
  }

  try {
    return new URL(assetPath, baseUrl).toString();
  } catch {
    return "";
  }
}

function buildPrimaryActionButton(label: string, uri: string) {
  return {
    type: "button" as const,
    style: "primary" as const,
    color: "#0F766E",
    flex: 1,
    height: "sm" as const,
    action: {
      type: "uri" as const,
      label,
      uri,
    },
  };
}

function buildSecondaryActionButton(label: string, uri: string) {
  return {
    type: "button" as const,
    style: "secondary" as const,
    color: "#EFF5F2",
    flex: 1,
    height: "sm" as const,
    action: {
      type: "uri" as const,
      label,
      uri,
    },
  };
}

function getShareCardData(card?: NormalizedCardData) {
  return card || getStaticFallbackCardData();
}

function buildShareActionRows(
  buttons: CardButton[],
  cleanUrl: string,
  primaryColor: string,
) {
  const normalizedButtons = buttons.filter((button) => button.label && button.url);
  const effectiveButtons = normalizedButtons.length
    ? normalizedButtons.slice(0, 4)
    : [{ label: "查看完整電子名片", url: cleanUrl }];
  const rows = [];

  for (let index = 0; index < effectiveButtons.length; index += 2) {
    const pair = effectiveButtons.slice(index, index + 2);
    const contents = pair.map((button, pairIndex) => {
      if (pairIndex % 2 === 0) {
        return {
          ...buildPrimaryActionButton(button.label, button.url),
          color: primaryColor,
        };
      }

      return buildSecondaryActionButton(button.label, button.url);
    });

    rows.push({
      type: "box" as const,
      layout: "horizontal" as const,
      spacing: "sm" as const,
      contents,
    });
  }

  return rows;
}

function logSharePayload(
  mode: SharePayloadMode,
  messages: Parameters<LiffInstance["shareTargetPicker"]>[0],
) {
  console.log("shareTargetPicker payload summary:", {
    mode,
    messagesLength: messages.length,
  });

  messages.forEach((message, index) => {
    console.log(`shareTargetPicker payload[${index}]`, message);
  });
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

export function buildShareTextMessage() {
  return {
    type: "text" as const,
    text: "LIFF 分享測試成功",
  };
}

export async function buildMinimalFlexMessage(cardData?: NormalizedCardData) {
  const card = getShareCardData(cardData);
  const cleanUrl = await getCleanShareUrl();

  return {
    type: "flex" as const,
    altText: `${card.brandName} 電子名片`,
    contents: {
      type: "bubble" as const,
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "md" as const,
        contents: [
          {
            type: "text" as const,
            text: card.brandName,
            size: "xs" as const,
            color: card.accentColor,
            weight: "bold" as const,
            letterSpacing: "2px",
          },
          {
            type: "text" as const,
            text: card.headline,
            size: "xl" as const,
            weight: "bold" as const,
            color: "#172033",
            wrap: true,
          },
          {
            type: "text" as const,
            text: card.subheadline,
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
            color: card.buttonBgColor,
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

export async function buildBusinessCardFlexMessage(
  cardData?: NormalizedCardData,
) {
  const card = getShareCardData(cardData);
  const cleanUrl = await getCleanShareUrl();
  const serviceBullets = card.bullets.slice(0, 3);

  return {
    type: "flex" as const,
    altText: `${card.brandName} 電子名片`,
    contents: {
      type: "bubble" as const,
      header: {
        type: "box" as const,
        layout: "vertical" as const,
        contents: [
          {
            type: "text" as const,
            text: card.brandName,
            size: "sm" as const,
            color: "#FFFFFF",
            weight: "bold" as const,
            wrap: true,
          },
        ],
        paddingTop: "14px",
        paddingBottom: "14px",
        paddingStart: "20px",
        paddingEnd: "20px",
        backgroundColor: card.accentColor,
      },
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "md" as const,
        contents: [
          {
            type: "box" as const,
            layout: "horizontal" as const,
            spacing: "md" as const,
            contents: [
              {
                type: "box" as const,
                layout: "vertical" as const,
                width: "56px",
                height: "56px",
                cornerRadius: "28px",
                backgroundColor: "#E6F3F1",
                justifyContent: "center" as const,
                alignItems: "center" as const,
                flex: 0,
                contents: [
                  {
                    type: "text" as const,
                    text: card.brandName.slice(0, 1) || "名",
                    size: "lg" as const,
                    weight: "bold" as const,
                    color: card.accentColor,
                    align: "center" as const,
                  },
                ],
              },
              {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "sm" as const,
                flex: 1,
                contents: [
                  {
                    type: "text" as const,
                    text: card.headline,
                    size: "xl" as const,
                    weight: "bold" as const,
                    color: "#172033",
                    wrap: true,
                  },
                  {
                    type: "text" as const,
                    text: card.subheadline,
                    size: "sm" as const,
                    color: "#5F6B84",
                    wrap: true,
                  },
                ],
              },
            ],
          },
          {
            type: "separator" as const,
            color: "#E3E8F2",
          },
          {
            type: "text" as const,
            text: card.intro,
            size: "sm" as const,
            color: "#172033",
            wrap: true,
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
            contents: serviceBullets.map((bullet) => ({
              type: "box" as const,
              layout: "horizontal" as const,
              spacing: "sm" as const,
              paddingAll: "12px",
              cornerRadius: "14px",
              backgroundColor: "#F8FAFC",
              contents: [
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  width: "16px",
                  height: "16px",
                  cornerRadius: "8px",
                  backgroundColor: card.accentColor,
                  margin: "xs" as const,
                  flex: 0,
                  contents: [],
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
          },
        ],
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
            color: card.buttonBgColor,
            action: {
              type: "uri" as const,
              label: "查看完整電子名片",
              uri: cleanUrl,
            },
          },
          {
            type: "button" as const,
            style: "secondary" as const,
            color: "#EFF3F8",
            action: {
              type: "uri" as const,
              label: card.buttons[0]?.label || "前往更多資訊",
              uri: card.buttons[0]?.url || cleanUrl,
            },
          },
        ],
        spacing: "sm" as const,
        paddingAll: "20px",
        backgroundColor: "#FFFFFF",
      },
    },
  };
}

export async function buildRefinedSafeBusinessCardFlexMessage(
  cardData?: NormalizedCardData,
) {
  const card = getShareCardData(cardData);
  const cleanUrl = await getCleanShareUrl();
  const serviceBullets = card.bullets.slice(0, 3);

  return {
    type: "flex" as const,
    altText: `${card.brandName} 電子名片`,
    contents: {
      type: "bubble" as const,
      header: {
        type: "box" as const,
        layout: "vertical" as const,
        contents: [
          {
            type: "text" as const,
            text: card.brandName,
            size: "sm" as const,
            color: "#FFFFFF",
            weight: "bold" as const,
            wrap: true,
          },
        ],
        paddingTop: "14px",
        paddingBottom: "14px",
        paddingStart: "20px",
        paddingEnd: "20px",
        backgroundColor: card.accentColor,
      },
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "md" as const,
        contents: [
          {
            type: "box" as const,
            layout: "horizontal" as const,
            spacing: "md" as const,
            contents: [
              {
                type: "box" as const,
                layout: "vertical" as const,
                width: "56px",
                height: "56px",
                cornerRadius: "28px",
                backgroundColor: "#E6F3F1",
                justifyContent: "center" as const,
                alignItems: "center" as const,
                flex: 0,
                contents: [
                  {
                    type: "text" as const,
                    text: card.brandName.slice(0, 1) || "名",
                    size: "lg" as const,
                    weight: "bold" as const,
                    color: card.accentColor,
                    align: "center" as const,
                  },
                ],
              },
              {
                type: "box" as const,
                layout: "vertical" as const,
                spacing: "sm" as const,
                flex: 1,
                contents: [
                  {
                    type: "text" as const,
                    text: card.headline,
                    size: "xl" as const,
                    weight: "bold" as const,
                    color: "#172033",
                    wrap: true,
                  },
                  {
                    type: "text" as const,
                    text: card.subheadline,
                    size: "sm" as const,
                    color: "#5F6B84",
                    wrap: true,
                  },
                ],
              },
            ],
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
            paddingAll: "14px",
            cornerRadius: "14px",
            backgroundColor: "#F5F8FC",
            contents: [
              {
                type: "text" as const,
                text: card.intro,
                size: "sm" as const,
                color: "#172033",
                wrap: true,
              },
            ],
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
            contents: serviceBullets.map((bullet) => ({
              type: "box" as const,
              layout: "horizontal" as const,
              spacing: "sm" as const,
              paddingAll: "12px",
              cornerRadius: "14px",
              backgroundColor: "#F8FAFC",
              contents: [
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  width: "16px",
                  height: "16px",
                  cornerRadius: "8px",
                  backgroundColor: card.accentColor,
                  margin: "xs" as const,
                  flex: 0,
                  contents: [],
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
            color: card.buttonBgColor,
            action: {
              type: "uri" as const,
              label: "查看完整電子名片",
              uri: cleanUrl,
            },
          },
          {
            type: "button" as const,
            style: "secondary" as const,
            color: "#EFF3F8",
            action: {
              type: "uri" as const,
              label: card.buttons[0]?.label || "前往更多資訊",
              uri: card.buttons[0]?.url || cleanUrl,
            },
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#FFFFFF",
      },
    },
  };
}

export async function buildPhotoAnd4CtaBusinessCardFlexMessage(
  cardData?: NormalizedCardData,
) {
  const card = getShareCardData(cardData);
  const cleanUrl = await getCleanShareUrl();
  const shareImageUrl = getShareAssetUrl(card.shareImageUrl || card.photoUrl);
  const serviceBullets = card.bullets.slice(0, 3);

  return {
    type: "flex" as const,
    altText: `${card.brandName} 電子名片`,
    contents: {
      type: "bubble" as const,
      ...(shareImageUrl
        ? {
            hero: {
              type: "image" as const,
              url: shareImageUrl,
              size: "full" as const,
              aspectRatio: "5:3",
              aspectMode: "cover" as const,
              backgroundColor: "#EAF4F1",
              action: {
                type: "uri" as const,
                label: "查看完整電子名片",
                uri: cleanUrl,
              },
            },
          }
        : {}),
      body: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "md" as const,
        contents: [
          {
            type: "text" as const,
            text: card.brandName,
            size: "sm" as const,
            color: card.accentColor,
            weight: "bold" as const,
            wrap: true,
          },
          {
            type: "text" as const,
            text: card.headline,
            size: "xl" as const,
            weight: "bold" as const,
            color: "#172033",
            wrap: true,
          },
          {
            type: "text" as const,
            text: card.subheadline,
            size: "sm" as const,
            color: "#5F6B84",
            wrap: true,
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
            paddingAll: "14px",
            cornerRadius: "14px",
            backgroundColor: "#F5F8FC",
            contents: [
              {
                type: "text" as const,
                text: card.intro,
                size: "sm" as const,
                color: "#172033",
                wrap: true,
              },
            ],
          },
          {
            type: "box" as const,
            layout: "vertical" as const,
            spacing: "sm" as const,
            contents: serviceBullets.map((bullet) => ({
              type: "box" as const,
              layout: "horizontal" as const,
              spacing: "sm" as const,
              paddingAll: "12px",
              cornerRadius: "14px",
              backgroundColor: "#F8FAFC",
              contents: [
                {
                  type: "box" as const,
                  layout: "vertical" as const,
                  width: "16px",
                  height: "16px",
                  cornerRadius: "8px",
                  backgroundColor: card.accentColor,
                  margin: "xs" as const,
                  flex: 0,
                  contents: [],
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
          },
        ],
        paddingAll: "20px",
        backgroundColor: "#FFFFFF",
      },
      footer: {
        type: "box" as const,
        layout: "vertical" as const,
        spacing: "sm" as const,
        contents: buildShareActionRows(
          card.buttons,
          cleanUrl,
          card.buttonBgColor,
        ),
        paddingTop: "0px",
        paddingBottom: "20px",
        paddingStart: "20px",
        paddingEnd: "20px",
        backgroundColor: "#FFFFFF",
      },
    },
  };
}

export async function buildShareCardMessages(cardData?: NormalizedCardData) {
  try {
    const flexMessage =
      SHARE_PAYLOAD_MODE === "minimal_bubble" ||
      SHARE_PAYLOAD_MODE === "text_and_minimal_flex"
        ? await buildMinimalFlexMessage(cardData)
        : SHARE_PAYLOAD_MODE === "photo_and_4cta_business_card_bubble"
          ? await buildPhotoAnd4CtaBusinessCardFlexMessage(cardData)
          : SHARE_PAYLOAD_MODE === "enhanced_business_card_bubble"
            ? await buildBusinessCardFlexMessage(cardData)
            : await buildRefinedSafeBusinessCardFlexMessage(cardData);

    if (SHARE_PAYLOAD_MODE === "flex_only") {
      return [flexMessage] as const;
    }

    if (SHARE_PAYLOAD_MODE === "text_and_minimal_flex") {
      return [
        {
          type: "text" as const,
          text: "LIFF Flex smoke test",
        },
        flexMessage,
      ] as const;
    }

    return [flexMessage] as const;
  } catch (error) {
    console.error("Failed to build share card messages", error);
    throw error;
  }
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
    logSharePayload(SHARE_PAYLOAD_MODE, messages);
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

export async function shareMinimalFlexViaLiff(): Promise<ShareExecutionResult> {
  const minimalFlexMessage = await buildMinimalFlexMessage();
  return shareMessages([minimalFlexMessage]);
}

export async function shareCardViaLiff(
  cardData?: NormalizedCardData,
): Promise<ShareExecutionResult> {
  const messages = await buildShareCardMessages(cardData);
  return shareMessages([...messages]);
}
