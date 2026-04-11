import type { MemberPlanKey } from "@/lib/auth/types";
import { cardTemplates } from "@/lib/card/templates";
import type { CardTemplateKey } from "@/lib/card/types";

export type AllowedTemplates = number | "all";

export type PlanConfig = {
  key: MemberPlanKey;
  label: string;
  maxCards: number;
  allowedTemplates: AllowedTemplates;
  removeWatermark: boolean;
  advancedShare: boolean;
  customSlug: boolean;
  prioritySupport: boolean;
};

export const planConfigs: Record<MemberPlanKey, PlanConfig> = {
  free: {
    key: "free",
    label: "Free",
    maxCards: 1,
    allowedTemplates: 2,
    removeWatermark: false,
    advancedShare: false,
    customSlug: false,
    prioritySupport: false,
  },
  starter: {
    key: "starter",
    label: "Starter",
    maxCards: 3,
    allowedTemplates: 6,
    removeWatermark: true,
    advancedShare: true,
    customSlug: false,
    prioritySupport: false,
  },
  pro: {
    key: "pro",
    label: "Pro",
    maxCards: 999,
    allowedTemplates: "all",
    removeWatermark: true,
    advancedShare: true,
    customSlug: true,
    prioritySupport: true,
  },
};

export function getPlanConfig(planKey: MemberPlanKey | null | undefined): PlanConfig {
  return planConfigs[planKey || "free"] || planConfigs.free;
}

export function getAllowedTemplateKeys(planKey: MemberPlanKey | null | undefined): CardTemplateKey[] {
  const config = getPlanConfig(planKey);

  if (config.allowedTemplates === "all") {
    return cardTemplates.map((template) => template.key);
  }

  return cardTemplates.slice(0, config.allowedTemplates).map((template) => template.key);
}
