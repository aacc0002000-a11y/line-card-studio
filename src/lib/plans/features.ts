import type { MemberPlanKey } from "@/lib/auth/types";
import type { CardTemplateKey } from "@/lib/card/types";
import { getAllowedTemplateKeys, getPlanConfig } from "@/lib/plans/config";

export type PlanFeatureKey =
  | "removeWatermark"
  | "advancedShare"
  | "customSlug"
  | "prioritySupport";

export function hasFeature(planKey: MemberPlanKey | null | undefined, featureKey: PlanFeatureKey) {
  const config = getPlanConfig(planKey);

  return Boolean(config[featureKey]);
}

export function canUseTemplate(
  planKey: MemberPlanKey | null | undefined,
  templateKey: CardTemplateKey,
) {
  return getAllowedTemplateKeys(planKey).includes(templateKey);
}

export function canUseAdvancedShare(planKey: MemberPlanKey | null | undefined) {
  return hasFeature(planKey, "advancedShare");
}

export function canEditCustomSlug(planKey: MemberPlanKey | null | undefined) {
  return hasFeature(planKey, "customSlug");
}

export function shouldShowWatermark(planKey: MemberPlanKey | null | undefined) {
  return !hasFeature(planKey, "removeWatermark");
}
