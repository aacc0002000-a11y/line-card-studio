import {
  canUseWebShare,
  isLineInAppBrowser,
  isMobileDevice,
  isProbablyLiffEnvironment,
} from "@/lib/share/environment";
import { buildSharePayload } from "@/lib/share/helpers";
import type { CardShareContext, LineSharePayload, ShareMode } from "@/lib/share/types";

export function buildLineSharePayload(context: CardShareContext): LineSharePayload {
  const payload = buildSharePayload(context);

  return {
    title: payload.title,
    text: payload.text,
    url: payload.url,
  };
}

export function canAttemptLineShare() {
  return isLineInAppBrowser() || isProbablyLiffEnvironment();
}

export function getPreferredShareMode(): ShareMode {
  if (canUseWebShare() && isMobileDevice()) {
    return "web-share";
  }

  if (canAttemptLineShare()) {
    return "line";
  }

  return "copy-link";
}
