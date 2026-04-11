export type LiffSdk = (typeof import("@line/liff"))["default"];
export type LiffContext = ReturnType<LiffSdk["getContext"]>;
export type LiffPermissionState = "granted" | "prompt" | "unavailable" | "unknown";
export type LiffInitStatus = "disabled" | "idle" | "initializing" | "ready" | "failed";
export type LiffShareMode = "sendMessages" | "shareTargetPicker" | "webShare" | "copyLink";

export type LineTextMessage = {
  type: "text";
  text: string;
};

export interface LiffRuntimeState {
  status: LiffInitStatus;
  hasLiffId: boolean;
  liffId: string;
  initialized: boolean;
  initError: string | null;
  inClient: boolean;
  loggedIn: boolean;
  contextType: string | null;
  scopeState: LiffPermissionState;
  canUseSendMessages: boolean;
  canUseShareTargetPicker: boolean;
}

export interface LiffShareResult {
  status: "success" | "cancelled" | "error" | "unavailable";
  mode: LiffShareMode;
  message: string;
  error?: unknown;
}
