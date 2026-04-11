import type { LiffSdk } from "@/lib/liff/types";

let liffClientPromise: Promise<LiffSdk | null> | null = null;

export function getLiffId() {
  return process.env.NEXT_PUBLIC_LIFF_ID || "";
}

export function hasLiffId() {
  return getLiffId().length > 0;
}

export async function loadLiffClient() {
  if (typeof window === "undefined") {
    return null;
  }

  if (!hasLiffId()) {
    return null;
  }

  if (!liffClientPromise) {
    liffClientPromise = import("@line/liff")
      .then((module) => module.default)
      .catch(() => null);
  }

  return liffClientPromise;
}
