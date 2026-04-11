import type { MemberPlanKey } from "@/lib/auth/types";
import type { SavedCardRecord } from "@/lib/card/types";
import { canCreateCard, isNearCardLimit } from "@/lib/plans/limits";

export function getPlanUsageSummary(
  planKey: MemberPlanKey | null | undefined,
  records: SavedCardRecord[],
) {
  const totalCards = records.length;
  const publishedCards = records.filter((record) => record.status === "published").length;
  const draftCards = totalCards - publishedCards;
  const cardLimit = canCreateCard(planKey, totalCards);

  return {
    totalCards,
    publishedCards,
    draftCards,
    cardLimit,
    isNearLimit: isNearCardLimit(planKey, totalCards),
  };
}
