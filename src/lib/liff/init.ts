import { toLiffErrorMessage } from "@/lib/liff/errors";
import { getLiffId, hasLiffId, loadLiffClient } from "@/lib/liff/client";
import type { LiffContext, LiffRuntimeState, LiffSdk } from "@/lib/liff/types";

let liffReadyPromise: Promise<LiffRuntimeState> | null = null;
let liffSdkRef: LiffSdk | null = null;

function createBaseState(): LiffRuntimeState {
  return {
    status: hasLiffId() ? "idle" : "disabled",
    hasLiffId: hasLiffId(),
    liffId: getLiffId(),
    initialized: false,
    initError: hasLiffId() ? null : "未設定 LIFF ID",
    inClient: false,
    loggedIn: false,
    contextType: null,
    scopeState: "unknown",
    canUseSendMessages: false,
    canUseShareTargetPicker: false,
  };
}

export async function initLiff(): Promise<LiffRuntimeState> {
  if (typeof window === "undefined") {
    return createBaseState();
  }

  if (!hasLiffId()) {
    return createBaseState();
  }

  const sdk = await loadLiffClient();

  if (!sdk) {
    return {
      ...createBaseState(),
      status: "failed",
      initError: "LIFF SDK 載入失敗",
    };
  }

  try {
    await sdk.init({ liffId: getLiffId() });
    liffSdkRef = sdk;

    const context = getLiffContextSafe(sdk);
    const inClient = sdk.isInClient();
    const loggedIn = sdk.isLoggedIn();
    const scopeState = await getChatMessageWriteScopeState(sdk);
    const canUseSendMessages =
      inClient &&
      isChatContext(context) &&
      hasApi(sdk, "sendMessages") &&
      scopeState !== "unavailable";
    const canUseShareTargetPicker = hasApi(sdk, "shareTargetPicker");

    return {
      status: "ready",
      hasLiffId: true,
      liffId: getLiffId(),
      initialized: true,
      initError: null,
      inClient,
      loggedIn,
      contextType: context?.type || null,
      scopeState,
      canUseSendMessages,
      canUseShareTargetPicker,
    };
  } catch (error) {
    return {
      ...createBaseState(),
      status: "failed",
      initError: toLiffErrorMessage(error, "LIFF 初始化失敗"),
    };
  }
}

export async function ensureLiffReady() {
  if (!liffReadyPromise) {
    liffReadyPromise = initLiff();
  }

  return liffReadyPromise;
}

export function getLiffClientSafe() {
  return liffSdkRef;
}

export function getLiffContextSafe(sdk?: LiffSdk): LiffContext | null {
  try {
    const client = sdk || liffSdkRef;

    return client ? client.getContext() : null;
  } catch {
    return null;
  }
}

function hasApi(sdk: LiffSdk, apiName: string) {
  try {
    return sdk.isApiAvailable(apiName);
  } catch {
    return false;
  }
}

async function getChatMessageWriteScopeState(sdk: LiffSdk) {
  try {
    const result = await sdk.permission.query("chat_message.write");

    return result.state;
  } catch {
    return "unknown" as const;
  }
}

function isChatContext(context: LiffContext | null) {
  return context?.type === "utou" || context?.type === "group" || context?.type === "room";
}
