import type { SavedCardRecord } from "@/lib/card/types";

export type ShareMode = "web-share" | "copy-link" | "line";

export interface SharePayload {
  title: string;
  text: string;
  url: string;
}

export interface ShareEnvironment {
  isMobile: boolean;
  canUseWebShare: boolean;
  isLineInApp: boolean;
  isProbablyLiff: boolean;
}

export interface LineSharePayload {
  title: string;
  text: string;
  url: string;
}

export interface CardShareContext {
  record: SavedCardRecord;
  publicUrl: string;
}
