import type { MemberPlanKey } from "@/lib/auth/types";
import type { CardTemplateKey, SavedCardRecord } from "@/lib/card/types";
import {
  canEditCustomSlug,
  canUseAdvancedShare,
  canUseTemplate,
  hasFeature,
  shouldShowWatermark,
} from "@/lib/plans/features";
import { canCreateCard } from "@/lib/plans/limits";
import { getPlanConfig } from "@/lib/plans/config";

export function assertCanCreateCard(
  planKey: MemberPlanKey | null | undefined,
  records: SavedCardRecord[],
) {
  const result = canCreateCard(planKey, records.length);

  if (!result.allowed) {
    throw new Error(`你目前方案的名片數量已達上限（${result.maxCards} 張），請先升級方案。`);
  }
}

export function assertCanDuplicateCard(
  planKey: MemberPlanKey | null | undefined,
  records: SavedCardRecord[],
) {
  return assertCanCreateCard(planKey, records);
}

export function getTemplateGate(
  planKey: MemberPlanKey | null | undefined,
  templateKey: CardTemplateKey,
) {
  const allowed = canUseTemplate(planKey, templateKey);
  const config = getPlanConfig(planKey);

  return {
    allowed,
    message: allowed
      ? null
      : `此模板需升級方案後才能使用。你目前的 ${config.label} 方案尚未開放這個模板。`,
  };
}

export function getFeatureGate(planKey: MemberPlanKey | null | undefined) {
  return {
    removeWatermark: hasFeature(planKey, "removeWatermark"),
    advancedShare: canUseAdvancedShare(planKey),
    customSlug: canEditCustomSlug(planKey),
    prioritySupport: hasFeature(planKey, "prioritySupport"),
    showWatermark: shouldShowWatermark(planKey),
  };
}

export function assertFeature(
  planKey: MemberPlanKey | null | undefined,
  featureKey: "advancedShare" | "customSlug",
) {
  const config = getPlanConfig(planKey);
  const allowed =
    featureKey === "advancedShare"
      ? canUseAdvancedShare(planKey)
      : canEditCustomSlug(planKey);

  if (!allowed) {
    throw new Error(`目前的 ${config.label} 方案尚未開放 ${featureKey}，請先升級方案。`);
  }
}

export function resolveCardSlug(input: {
  planKey: MemberPlanKey | null | undefined;
  desiredSlug?: string | null;
  fallbackSource: string;
}) {
  const normalizedFallback = slugify(input.fallbackSource);

  if (!canEditCustomSlug(input.planKey)) {
    return normalizedFallback;
  }

  const desired = slugify(input.desiredSlug || "");

  return desired || normalizedFallback;
}

function slugify(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, 48);
}
