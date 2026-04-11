import { ensureLiffReady } from "@/lib/liff/init";
import type { LiffRuntimeState } from "@/lib/liff/types";

export function hasUsableLiffId() {
  return Boolean(process.env.NEXT_PUBLIC_LIFF_ID);
}

export function isLiffReady(state: LiffRuntimeState) {
  return state.status === "ready" && state.initialized;
}

export function canAttemptSendMessages(state: LiffRuntimeState) {
  return isLiffReady(state) && state.canUseSendMessages;
}

export function canAttemptShareTargetPicker(state: LiffRuntimeState) {
  return isLiffReady(state) && state.canUseShareTargetPicker;
}

export function shouldFallbackToWebShare(state: LiffRuntimeState) {
  return !canAttemptSendMessages(state) && !canAttemptShareTargetPicker(state);
}

export async function inspectLiffEnvironment() {
  return ensureLiffReady();
}
