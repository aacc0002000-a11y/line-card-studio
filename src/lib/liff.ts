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

  const sanitizedSiteUrl = sanitizeUrl(SITE_URL || "");

  if (sanitizedSiteUrl) {
    return sanitizedSiteUrl;
  }

  return sanitizeUrl(getOriginAndPathnameUrl()) || getOriginAndPathnameUrl();
}

export async function shareCardViaLiff(title: string) {
  const liff = await initLiffIfAvailable();
  const cleanUrl = await getCleanShareUrl();

  if (!liff || !liff.isInClient()) {
    return {
      shared: false,
      url: cleanUrl,
    };
  }

  try {
    const result = await liff.shareTargetPicker([
      {
        type: "text",
        text: `${title}\n${cleanUrl}`,
      },
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
