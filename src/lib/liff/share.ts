import { buildPublicCardDescription } from "@/lib/card/mapper";
import { toLiffErrorMessage, isLiffCancellationError } from "@/lib/liff/errors";
import {
  canAttemptSendMessages,
  canAttemptShareTargetPicker,
} from "@/lib/liff/environment";
import { ensureLiffReady, getLiffClientSafe } from "@/lib/liff/init";
import type { SavedCardRecord } from "@/lib/card/types";
import type {  LiffShareResult,
  LineTextMessage,
} from "@/lib/liff/types";

export function buildLineTextMessage(record: SavedCardRecord, publicUrl: string): LineTextMessage {
  const title = record.cardName.trim() || `${record.data.displayName} 的電子名片`;
  const description = buildPublicCardDescription(record);

  return {
    type: "text",
    text: `${title}\n${description}\n${publicUrl}`,
  };
}

export function buildLineShareMessages(record: SavedCardRecord, publicUrl: string) {
  return [buildLineTextMessage(record, publicUrl)];
}

export async function getPreferredShareMode(options?: { canUseWebShare?: boolean }) {
  const state = await ensureLiffReady();

  if (canAttemptSendMessages(state)) {
    return "sendMessages" as const;
  }

  if (canAttemptShareTargetPicker(state)) {
    return "shareTargetPicker" as const;
  }

  if (options?.canUseWebShare) {
    return "webShare" as const;
  }

  return "copyLink" as const;
}

export async function shareCardViaCurrentChat(record: SavedCardRecord, publicUrl: string): Promise<LiffShareResult> {
  const state = await ensureLiffReady();

  if (!canAttemptSendMessages(state)) {
    return {
      status: "unavailable",
      mode: "sendMessages",
      message: state.initError || "目前無法傳到目前聊天室",
    };
  }

  const sdk = getLiffClientSafe();

  if (!sdk) {
    return {
      status: "unavailable",
      mode: "sendMessages",
      message: "LIFF 尚未完成初始化",
    };
  }

  try {
    await sdk.sendMessages(buildLineShareMessages(record, publicUrl));

    return {
      status: "success",
      mode: "sendMessages",
      message: "已傳送到目前聊天室。",
    };
  } catch (error) {
    return {
      status: isLiffCancellationError(error) ? "cancelled" : "error",
      mode: "sendMessages",
      message: isLiffCancellationError(error)
        ? "已取消傳送到目前聊天室。"
        : toLiffErrorMessage(error, "傳送到目前聊天室失敗"),
      error,
    };
  }
}

export async function shareCardViaTargetPicker(record: SavedCardRecord, publicUrl: string): Promise<LiffShareResult> {
  const state = await ensureLiffReady();

  if (!canAttemptShareTargetPicker(state)) {
    return {
      status: "unavailable",
      mode: "shareTargetPicker",
      message: state.initError || "目前無法開啟好友 / 群組選擇器",
    };
  }

  const sdk = getLiffClientSafe();

  if (!sdk) {
    return {
      status: "unavailable",
      mode: "shareTargetPicker",
      message: "LIFF 尚未完成初始化",
    };
  }

  try {
    const result = await sdk.shareTargetPicker(buildLineShareMessages(record, publicUrl));

    if (!result) {
      return {
        status: "cancelled",
        mode: "shareTargetPicker",
        message: "已取消選好友 / 群組分享。",
      };
    }

    return {
      status: "success",
      mode: "shareTargetPicker",
      message: "已開啟好友 / 群組分享。",
    };
  } catch (error) {
    return {
      status: isLiffCancellationError(error) ? "cancelled" : "error",
      mode: "shareTargetPicker",
      message: isLiffCancellationError(error)
        ? "已取消選好友 / 群組分享。"
        : toLiffErrorMessage(error, "選好友 / 群組分享失敗"),
      error,
    };
  }
}

export async function shareCardViaLine(
  record: SavedCardRecord,
  publicUrl: string,
  options?: { canUseWebShare?: boolean },
): Promise<LiffShareResult> {
  const mode = await getPreferredShareMode(options);

  if (mode === "sendMessages") {
    return shareCardViaCurrentChat(record, publicUrl);
  }

  if (mode === "shareTargetPicker") {
    return shareCardViaTargetPicker(record, publicUrl);
  }

  return {
    status: "unavailable",
    mode,
    message:
      mode === "webShare"
        ? "LINE 分享不可用，建議改用系統分享。"
        : "LINE 分享不可用，建議改用複製連結。",
  };
}
