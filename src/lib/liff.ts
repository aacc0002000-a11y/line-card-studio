const LIFF_ID = process.env.NEXT_PUBLIC_LIFF_ID;
type LiffInstance = (typeof import("@line/liff"))["default"];

let liffInstancePromise: Promise<LiffInstance | null> | null = null;
let hasInitialized = false;

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

export async function shareCardViaLiff(url: string, title: string) {
  const liff = await initLiffIfAvailable();

  if (!liff || !liff.isInClient()) {
    return false;
  }

  try {
    const result = await liff.shareTargetPicker([
      {
        type: "text",
        text: `${title}\n${url}`,
      },
    ]);

    return result !== null;
  } catch {
    return false;
  }
}
