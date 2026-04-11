"use client";

import { useEffect, useMemo, useState } from "react";
import { CopyLinkButton } from "@/components/share/CopyLinkButton";
import { LineShareButton } from "@/components/share/LineShareButton";
import { LiffStatusBadge } from "@/components/share/LiffStatusBadge";
import { QrCodePanel } from "@/components/share/QrCodePanel";
import { ShareStatusMessage } from "@/components/share/ShareStatusMessage";
import { WebShareButton } from "@/components/share/WebShareButton";
import {
  canAttemptSendMessages,
  canAttemptShareTargetPicker,
  inspectLiffEnvironment,
  shouldFallbackToWebShare,
} from "@/lib/liff";
import type { LiffRuntimeState } from "@/lib/liff";
import { canUseAdvancedShare } from "@/lib/plans/features";
import { canUseWebShare, isMobileDevice } from "@/lib/share/environment";
import { buildSharePayload, getBrowserShareUrl } from "@/lib/share/helpers";
import type { SavedCardRecord } from "@/lib/card/types";

export function ShareActions({
  record,
  publicUrl,
}: {
  record: SavedCardRecord;
  publicUrl: string;
}) {
  const [status, setStatus] = useState<{
    kind: "success" | "error" | "info";
    message: string;
  } | null>(null);
  const [liffState, setLiffState] = useState<LiffRuntimeState | null>(null);

  const resolvedUrl = useMemo(() => getBrowserShareUrl(publicUrl), [publicUrl]);
  const sharePayload = useMemo(
    () => buildSharePayload({ record, publicUrl: resolvedUrl }),
    [record, resolvedUrl],
  );

  useEffect(() => {
    let mounted = true;

    void (async () => {
      const nextState = await inspectLiffEnvironment();

      if (mounted) {
        setLiffState(nextState);
      }
    })();

    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!status) {
      return;
    }

    const timer = window.setTimeout(() => setStatus(null), 2400);

    return () => window.clearTimeout(timer);
  }, [status]);

  const showSendMessages = liffState ? canAttemptSendMessages(liffState) : false;
  const showTargetPicker = liffState ? canAttemptShareTargetPicker(liffState) : false;
  const showFallbackHint = liffState ? shouldFallbackToWebShare(liffState) : false;
  const advancedShareEnabled = canUseAdvancedShare(record.ownerPlanKey);

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,0.92fr)_minmax(280px,0.38fr)]">
      <section className="rounded-[28px] border border-line bg-card p-5 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <h2 className="text-lg font-semibold text-foreground">分享名片</h2>
            <p className="mt-2 text-sm leading-6 text-muted">
              在 LINE / LIFF 環境會優先使用 LINE 分享；若條件不符，會回退到系統分享或複製連結。
            </p>
          </div>
          <LiffStatusBadge state={liffState} />
        </div>

        <div className="mt-5 flex flex-wrap gap-3">
          {showSendMessages ? (
            <LineShareButton
              mode="sendMessages"
              record={record}
              publicUrl={resolvedUrl}
              onStatus={setStatus}
            />
          ) : null}
          {showTargetPicker ? (
            <LineShareButton
              mode="shareTargetPicker"
              record={record}
              publicUrl={resolvedUrl}
              onStatus={setStatus}
            />
          ) : null}
          <WebShareButton payload={sharePayload} onStatus={setStatus} />
          <CopyLinkButton url={resolvedUrl} onStatus={setStatus} />
        </div>
        {!advancedShareEnabled ? (
          <p className="mt-4 text-sm text-amber-700">
            此名片目前為免費版公開體驗，只提供複製連結與基本系統分享；LINE / LIFF 進階分享需升級方案。
          </p>
        ) : null}

        <div className="mt-5 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <Meta label="手機裝置" value={isMobileDevice() ? "是" : "否"} />
          <Meta label="Web Share" value={canUseWebShare() ? "可用" : "不可用"} />
          <Meta label="傳目前聊天室" value={advancedShareEnabled && showSendMessages ? "可用" : "需升級"} />
          <Meta label="選好友 / 群組" value={advancedShareEnabled && showTargetPicker ? "可用" : "需升級"} />
        </div>

        <div className="mt-4 rounded-2xl bg-[#f8fafc] px-4 py-3 text-sm text-muted">
          <p>LIFF 狀態：{liffState?.status || "initializing"}</p>
          <p className="mt-1">聊天室上下文：{liffState?.contextType || "none"}</p>
          <p className="mt-1">chat_message.write：{liffState?.scopeState || "unknown"}</p>
          {liffState?.initError ? <p className="mt-2 text-amber-700">{liffState.initError}</p> : null}
          {showFallbackHint ? (
            <p className="mt-2">目前將回退到 Web Share / Copy Link。</p>
          ) : null}
        </div>

        {status ? (
          <div className="mt-4">
            <ShareStatusMessage kind={status.kind} message={status.message} />
          </div>
        ) : null}
      </section>

      <QrCodePanel url={resolvedUrl} />
    </div>
  );
}

function Meta({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-[#f8fafc] px-4 py-3">
      <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">{label}</p>
      <p className="mt-1 text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}
