import type { LiffRuntimeState } from "@/lib/liff/types";

export function LiffStatusBadge({ state }: { state: LiffRuntimeState | null }) {
  if (!state) {
    return (
      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        LIFF 初始化中
      </div>
    );
  }

  if (state.status === "disabled") {
    return (
      <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
        LIFF 未設定
      </div>
    );
  }

  if (state.status === "failed") {
    return (
      <div className="inline-flex rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
        LIFF 初始化失敗
      </div>
    );
  }

  if (state.canUseSendMessages) {
    return (
      <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        可傳到目前聊天室
      </div>
    );
  }

  if (state.canUseShareTargetPicker) {
    return (
      <div className="inline-flex rounded-full bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
        可選好友 / 群組分享
      </div>
    );
  }

  return (
    <div className="inline-flex rounded-full bg-slate-100 px-3 py-1 text-xs font-semibold text-slate-700">
      將使用一般分享 fallback
    </div>
  );
}
