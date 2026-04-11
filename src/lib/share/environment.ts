function getUserAgent() {
  if (typeof navigator === "undefined") {
    return "";
  }

  return navigator.userAgent || "";
}

export function isMobileDevice() {
  return /Android|iPhone|iPad|iPod|Mobile/i.test(getUserAgent());
}

export function canUseWebShare() {
  return typeof navigator !== "undefined" && typeof navigator.share === "function";
}

export function isLineInAppBrowser() {
  return /Line\//i.test(getUserAgent()) || /LIFF/i.test(getUserAgent());
}

export function isProbablyLiffEnvironment() {
  if (typeof window === "undefined") {
    return false;
  }

  return Boolean((window as typeof window & { liff?: unknown }).liff) || /LIFF/i.test(getUserAgent());
}
