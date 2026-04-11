"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { startTransition, useEffect, useMemo, useState } from "react";
import { CurrentPlanSummary } from "@/components/billing/CurrentPlanSummary";
import { CardPreview } from "@/components/card/CardPreview";
import { CardForm } from "@/components/editor/CardForm";
import { ImageUploadSection } from "@/components/editor/ImageUploadSection";
import { TemplatePicker } from "@/components/editor/TemplatePicker";
import { ThemePicker } from "@/components/editor/ThemePicker";
import type { MemberProfile } from "@/lib/auth/types";
import { defaultCardName, defaultCardProfile } from "@/lib/card/defaults";
import {
  buildDefaultCardName,
  formatCardDateTime,
  getStatusBadgeClassName,
  getStatusLabel,
} from "@/lib/card/mapper";
import { cardRepository } from "@/lib/card/repository";
import { getPublicCardPath, publishCard, unpublishCard } from "@/lib/card/publishing";
import {
  buildFallbackSlugSource,
  checkSlugAvailability,
  getSlugPreview,
  isSlugConflictError,
  normalizeCardSlug,
  resolveCardSlugForSave,
} from "@/lib/card/slug";
import { useCardRecords, useCardRecord } from "@/lib/card/storage";
import { assertCanCreateCard, getFeatureGate, getTemplateGate } from "@/lib/plans/guards";
import { canCreateCard } from "@/lib/plans/limits";
import { getAllowedTemplateKeys, getPlanConfig } from "@/lib/plans/config";
import { shouldShowWatermark } from "@/lib/plans/features";
import type {
  CardProfileData,
  CardStatus,
  CardTemplateKey,
  CardThemeKey,
} from "@/lib/card/types";

type FeedbackState = {
  kind: "success" | "error" | "info";
  message: string;
} | null;

type SlugFeedbackState = {
  kind: "idle" | "checking" | "available" | "error";
  message: string;
} | null;

export function EditorPageClient({ profile }: { profile: MemberProfile | null }) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const cardId = searchParams.get("cardId");
  const { records, refresh: refreshRecords } = useCardRecords();
  const { record, isLoading, error: loadError, refresh: refreshRecord } = useCardRecord(cardId);
  const [cardData, setCardData] = useState<CardProfileData>(defaultCardProfile);
  const [cardName, setCardName] = useState(defaultCardName);
  const [customSlug, setCustomSlug] = useState("");
  const [cardStatus, setCardStatus] = useState<CardStatus>("draft");
  const [feedback, setFeedback] = useState<FeedbackState>(null);
  const [slugFeedback, setSlugFeedback] = useState<SlugFeedbackState>(null);
  const createGuard = canCreateCard(profile?.planKey, records.length);
  const isEditingExistingCard = Boolean(cardId);
  const currentTemplateGate = getTemplateGate(profile?.planKey, cardData.templateKey);
  const lockedTemplateKeys = cardTemplatesLocked(profile?.planKey);
  const currentPlan = getPlanConfig(profile?.planKey);
  const featureGate = getFeatureGate(profile?.planKey);

  useEffect(() => {
    if (!feedback) {
      return;
    }

    const timer = window.setTimeout(() => setFeedback(null), 2400);

    return () => window.clearTimeout(timer);
  }, [feedback]);

  useEffect(() => {
    startTransition(() => {
      if (record) {
        setCardData(record.data);
        setCardName(record.cardName);
        setCustomSlug(record.slug);
        setCardStatus(record.status);
        return;
      }

      setCardData(defaultCardProfile);
      setCardName(defaultCardName);
      setCustomSlug("");
      setCardStatus("draft");
      setSlugFeedback(null);
    });
  }, [record]);

  const slugPreview = useMemo(
    () =>
      getSlugPreview({
        planKey: profile?.planKey,
        desiredSlug: customSlug,
        fallbackSource: buildFallbackSlugSource({
          cardName,
          displayName: cardData.displayName,
        }),
      }),
    [profile?.planKey, customSlug, cardName, cardData.displayName],
  );

  const publicPath = useMemo(
    () =>
      cardId
        ? getPublicCardPath({
            id: cardId,
            slug: record?.slug || slugPreview,
          })
        : null,
    [cardId, record?.slug, slugPreview],
  );

  const handleTemplateChange = (templateKey: CardTemplateKey) => {
    const gate = getTemplateGate(profile?.planKey, templateKey);

    if (!gate.allowed) {
      setFeedback({
        kind: "info",
        message: gate.message || "此模板需升級方案後使用。",
      });
      return;
    }

    setCardData((current) => ({
      ...current,
      templateKey,
    }));
  };

  const handleThemeChange = (themeKey: CardThemeKey) => {
    setCardData((current) => ({
      ...current,
      themeKey,
    }));
  };

  const syncAfterMutation = async (nextId?: string) => {
    await refreshRecords();
    if (nextId || cardId) {
      await refreshRecord();
    }
    if (nextId) {
      router.replace(`/editor?cardId=${nextId}`);
    }
  };

  const checkDesiredSlug = async (value: string) => {
    if (!featureGate.customSlug) {
      return;
    }

    const normalized = normalizeCardSlug(value);

    if (!normalized) {
      setSlugFeedback({
        kind: "idle",
        message: "若不填寫 custom slug，系統會改用自動生成的可讀網址。",
      });
      return;
    }

    setSlugFeedback({
      kind: "checking",
      message: "正在檢查 slug 是否可用...",
    });

    try {
      const availability = await checkSlugAvailability({
        slug: normalized,
        excludeCardId: cardId,
      });

      if (availability.available) {
        setSlugFeedback({
          kind: "available",
          message: `可用：/p/${availability.slug}`,
        });
        return;
      }

      setSlugFeedback({
        kind: "error",
        message: availability.message,
      });
    } catch (caughtError) {
      setSlugFeedback({
        kind: "error",
        message: caughtError instanceof Error ? caughtError.message : "slug 檢查失敗。",
      });
    }
  };

  const persistCard = async (status: CardStatus, mode: "current" | "new" = "current") => {
    const nextCardName = cardName.trim() || buildDefaultCardName(cardData);
    const fallbackSource = buildFallbackSlugSource({
      cardName: nextCardName,
      displayName: cardData.displayName,
    });
    const wantsCustomSlug = featureGate.customSlug && Boolean(normalizeCardSlug(customSlug));

    if (!cardId && mode === "current") {
      assertCanCreateCard(profile?.planKey, records);
    }

    for (let attempt = 0; attempt < 4; attempt += 1) {
      const nextSlug = await resolveCardSlugForSave({
        planKey: profile?.planKey,
        desiredSlug: customSlug,
        fallbackSource,
        excludeCardId: mode === "current" ? cardId : undefined,
        seed: `${cardId || profile?.id || "member"}-${attempt}`,
      });

      try {
        if (mode === "current" && cardId) {
          const updated = await cardRepository.update(cardId, cardData, {
            cardName: nextCardName,
            status,
            slug: nextSlug.slug,
            ownerPlanKey: profile?.planKey || "free",
          });

          if (nextSlug.source === "custom") {
            setSlugFeedback({
              kind: "available",
              message: `已套用 custom slug：/p/${nextSlug.slug}`,
            });
          }

          return updated;
        }

        const created = await cardRepository.create(cardData, {
          cardName: nextCardName,
          status,
          slug: nextSlug.slug,
          ownerPlanKey: profile?.planKey || "free",
        });

        if (nextSlug.source === "custom") {
          setSlugFeedback({
            kind: "available",
            message: `已套用 custom slug：/p/${nextSlug.slug}`,
          });
        }

        return created;
      } catch (caughtError) {
        if (!wantsCustomSlug && isSlugConflictError(caughtError)) {
          continue;
        }

        if (wantsCustomSlug && isSlugConflictError(caughtError)) {
          throw new Error(`公開識別「${nextSlug.slug}」已被使用，請改用其他 slug。`);
        }

        throw caughtError;
      }
    }

    throw new Error("系統目前無法產生可用的公開 slug，請稍後再試。");
  };

  const handleSaveDraft = async () => {
    try {
      const saved = await persistCard(cardStatus === "published" ? "published" : "draft");

      if (!saved) {
        setFeedback({ kind: "error", message: "儲存失敗，找不到目前草稿。" });
        return;
      }

      setCardName(saved.cardName);
      setCardStatus(saved.status);
      setFeedback({ kind: "success", message: "草稿已更新。" });
      await syncAfterMutation(saved.id);
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message: caughtError instanceof Error ? caughtError.message : "儲存失敗。",
      });
    }
  };

  const handleSaveAsNew = async () => {
    try {
      assertCanCreateCard(profile?.planKey, records);
      const created = await persistCard("draft", "new");

      if (!created) {
        setFeedback({ kind: "error", message: "另存失敗，無法建立新的草稿。" });
        return;
      }

      setCardName(created.cardName);
      setCardStatus(created.status);
      setFeedback({ kind: "success", message: "已另存為新草稿。" });
      await syncAfterMutation(created.id);
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message: caughtError instanceof Error ? caughtError.message : "另存失敗。",
      });
    }
  };

  const handlePublish = async () => {
    try {
      let published = null;

      if (cardId) {
        const saved = await persistCard(cardStatus);

        if (!saved) {
          setFeedback({ kind: "error", message: "發佈失敗，找不到目前草稿。" });
          return;
        }

        published = await publishCard(saved.id);
      } else {
        published = await persistCard("published");
      }

      if (!published) {
        setFeedback({ kind: "error", message: "發佈失敗，請稍後再試。" });
        return;
      }

      setCardName(published.cardName);
      setCardStatus(published.status);
      setFeedback({ kind: "success", message: "名片已發佈，可使用公開頁分享。" });
      await syncAfterMutation(published.id);
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message: caughtError instanceof Error ? caughtError.message : "發佈失敗。",
      });
    }
  };

  const handleUnpublish = async () => {
    if (!cardId) {
      setFeedback({ kind: "info", message: "這張名片尚未保存，無法取消發佈。" });
      return;
    }

    try {
      const unpublished = await unpublishCard(cardId);

      if (!unpublished) {
        setFeedback({ kind: "error", message: "取消發佈失敗，找不到目前草稿。" });
        return;
      }

      setCardStatus(unpublished.status);
      setFeedback({ kind: "success", message: "名片已回到草稿狀態。" });
      await syncAfterMutation(cardId);
    } catch (caughtError) {
      setFeedback({
        kind: "error",
        message: caughtError instanceof Error ? caughtError.message : "取消發佈失敗。",
      });
    }
  };

  const handleReset = () => {
    setCardData(defaultCardProfile);
    setCardName(defaultCardName);
    setCustomSlug("");
    setCardStatus("draft");
    setSlugFeedback(null);
    router.replace("/editor");
    setFeedback({ kind: "info", message: "已重設為預設值。" });
  };

  const handleLoadExisting = (nextId: string) => {
    if (!nextId) {
      router.push("/editor");
      return;
    }

    router.push(`/editor?cardId=${nextId}`);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-7xl">
        <header className="rounded-[32px] border border-line bg-card px-6 py-7 shadow-sm">
          <p className="text-sm font-semibold tracking-[0.24em] text-accent">
            LINE CARD STUDIO
          </p>
          <h1 className="mt-3 text-3xl font-semibold text-foreground sm:text-4xl">
            電子名片編輯器
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-muted sm:text-base">
            這裡負責草稿編輯與正式發佈。已發佈名片會有公開頁，草稿則只保留在管理視角中。
          </p>
        </header>

        <section className="mt-6 rounded-[28px] border border-line bg-card p-5 shadow-sm">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3 rounded-2xl bg-[#f8fafc] px-4 py-4">
            <div>
              <p className="text-[11px] font-semibold tracking-[0.16em] text-muted">PLAN USAGE</p>
              <p className="mt-1 text-sm text-foreground">
                目前方案 {currentPlan.label}，名片已使用 {records.length} / {createGuard.maxCards >= 999 ? "不限" : createGuard.maxCards}。
              </p>
            </div>
            <Link
              href="/upgrade"
              className="inline-flex min-h-11 items-center justify-center rounded-2xl border border-line px-4 py-2.5 text-sm font-semibold text-foreground hover:-translate-y-0.5"
            >
              升級方案
            </Link>
          </div>
          {!isEditingExistingCard && !createGuard.allowed ? (
            <p className="mb-4 text-sm text-red-600">
              你目前方案的名片數量已達上限，暫時無法建立新名片或另存新草稿。升級後即可繼續新增。
            </p>
          ) : null}
          {!currentTemplateGate.allowed ? (
            <p className="mb-4 text-sm text-amber-700">
              {currentTemplateGate.message}
            </p>
          ) : null}

          <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_auto] xl:items-end">
            <div className="grid gap-4 md:grid-cols-2">
              <label className="block">
                <span className="text-sm font-medium text-foreground">名片名稱</span>
                <input
                  type="text"
                  value={cardName}
                  onChange={(event) => setCardName(event.target.value)}
                  placeholder="王大明的電子名片"
                  className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-foreground">載入既有草稿</span>
                <select
                  value={cardId || ""}
                  onChange={(event) => handleLoadExisting(event.target.value)}
                  className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent"
                >
                  <option value="">建立新草稿</option>
                  {records.map((savedRecord) => (
                    <option key={savedRecord.id} value={savedRecord.id}>
                      {savedRecord.cardName}｜{formatCardDateTime(savedRecord.updatedAt)}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block md:col-span-2">
                <span className="text-sm font-medium text-foreground">Custom Slug</span>
                <input
                  type="text"
                  value={customSlug}
                  onChange={(event) => {
                    if (!featureGate.customSlug) {
                      setFeedback({
                        kind: "info",
                        message: "自訂公開識別僅提供 Pro 方案，免費版與 Starter 會使用系統自動生成。",
                      });
                      return;
                    }

                    setCustomSlug(event.target.value);
                    setSlugFeedback(null);
                  }}
                  onBlur={() => void checkDesiredSlug(customSlug)}
                  placeholder={featureGate.customSlug ? "your-brand-card" : "目前方案僅支援系統自動產生"}
                  disabled={!featureGate.customSlug}
                  className="mt-2 w-full rounded-2xl border border-line bg-white px-4 py-3 text-sm text-foreground outline-none focus:border-accent disabled:cursor-not-allowed disabled:bg-[#f8fafc] disabled:text-muted"
                />
                <p className="mt-2 text-xs text-muted">
                  {featureGate.customSlug
                    ? "Pro 方案可自訂公開 slug；若留空，會改用系統自動生成的可讀網址。"
                    : "你目前方案尚未開放 custom slug，系統仍會自動生成公開識別。"}
                </p>
                <p className="mt-1 text-xs text-muted">預覽路徑：/p/{slugPreview}</p>
                {slugFeedback ? (
                  <p
                    className={`mt-2 text-xs ${
                      slugFeedback.kind === "error"
                        ? "text-red-600"
                        : slugFeedback.kind === "available"
                          ? "text-emerald-700"
                          : "text-muted"
                    }`}
                  >
                    {slugFeedback.message}
                  </p>
                ) : null}
              </label>
            </div>

            <div className="flex flex-wrap gap-3">
              <button
                type="button"
                onClick={() => void handleSaveDraft()}
                disabled={!isEditingExistingCard && !createGuard.allowed}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-accent px-5 py-3 text-sm font-semibold text-white shadow-sm hover:-translate-y-0.5"
              >
                儲存草稿
              </button>
              <button
                type="button"
                onClick={() => void handleSaveAsNew()}
                disabled={!createGuard.allowed}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
              >
                另存新草稿
              </button>
              {cardStatus === "published" ? (
                <button
                  type="button"
                  onClick={() => void handleUnpublish()}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-amber-200 px-5 py-3 text-sm font-semibold text-amber-700 hover:-translate-y-0.5"
                >
                  取消發佈
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => void handlePublish()}
                  disabled={!isEditingExistingCard && !createGuard.allowed}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700 hover:-translate-y-0.5"
                >
                  發佈名片
                </button>
              )}
              <button
                type="button"
                onClick={handleReset}
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
              >
                重設預設值
              </button>
              <Link
                href="/my-cards"
                className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-line px-5 py-3 text-sm font-semibold text-foreground hover:-translate-y-0.5"
              >
                查看我的名片
              </Link>
              {publicPath && cardStatus === "published" ? (
                <Link
                  href={publicPath}
                  className="inline-flex min-h-12 items-center justify-center rounded-2xl border border-emerald-200 px-5 py-3 text-sm font-semibold text-emerald-700 hover:-translate-y-0.5"
                >
                  查看公開頁
                </Link>
              ) : null}
            </div>
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm">
            <p className="text-muted">
              {record
                ? `目前草稿：${record.cardName}｜最後更新 ${formatCardDateTime(record.updatedAt)}`
                : isLoading
                  ? "正在讀取草稿資料..."
                  : "目前為未儲存的新草稿。"}
            </p>
            <span
              className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(cardStatus)}`}
            >
              {getStatusLabel(cardStatus)}
            </span>
            {feedback ? (
              <p className={feedback.kind === "error" ? "text-red-600" : "text-accent"}>
                {feedback.message}
              </p>
            ) : null}
            {loadError ? <p className="text-red-600">{loadError}</p> : null}
          </div>
        </section>

        <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.12fr)_minmax(360px,0.88fr)]">
          <section className="space-y-6">
            <TemplatePicker
              value={cardData.templateKey}
              onChange={handleTemplateChange}
              lockedKeys={lockedTemplateKeys}
            />
            <ThemePicker value={cardData.themeKey} onChange={handleThemeChange} />
            <CardForm value={cardData} onChange={setCardData} />
            <ImageUploadSection value={cardData} onChange={setCardData} cardId={cardId} />
            <CurrentPlanSummary profile={profile} />
          </section>

          <aside className="xl:sticky xl:top-6 xl:self-start">
            <section className="rounded-[28px] border border-line bg-card p-4 shadow-sm sm:p-5">
              <div className="mb-4 flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">即時預覽</h2>
                  <p className="mt-1 text-sm text-muted">
                    模板、色系、文字與圖片修改都會直接反映。
                  </p>
                </div>
                <div
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${getStatusBadgeClassName(cardStatus)}`}
                >
                  {getStatusLabel(cardStatus)}
                </div>
              </div>
              <div className="mx-auto max-w-[680px]">
                <CardPreview
                  data={cardData}
                  showWatermark={shouldShowWatermark(profile?.planKey)}
                />
              </div>
            </section>
          </aside>
        </div>
      </div>
    </main>
  );
}

function cardTemplatesLocked(planKey: MemberProfile["planKey"] | null | undefined) {
  const allowedKeys = getAllowedTemplateKeys(planKey);

  return ["portrait-center", "top-cover", "top-left-avatar", "hero-split"].filter(
    (key): key is CardTemplateKey => !allowedKeys.includes(key as CardTemplateKey),
  );
}
