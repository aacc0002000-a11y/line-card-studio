import type { MemberPlanKey } from "@/lib/auth/types";
import { getPlanConfig } from "@/lib/plans/config";

export function canCreateCard(
  planKey: MemberPlanKey | null | undefined,
  currentCount: number,
) {
  const config = getPlanConfig(planKey);
  const remaining = Math.max(config.maxCards - currentCount, 0);

  return {
    allowed: currentCount < config.maxCards,
    remaining,
    maxCards: config.maxCards,
  };
}

export function isNearCardLimit(
  planKey: MemberPlanKey | null | undefined,
  currentCount: number,
) {
  const config = getPlanConfig(planKey);

  if (config.maxCards >= 999) {
    return false;
  }

  return currentCount >= Math.max(config.maxCards - 1, 1);
}
