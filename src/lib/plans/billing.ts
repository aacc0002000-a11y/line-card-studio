import type { MemberPlanKey } from "@/lib/auth/types";
import { getPlanConfig } from "@/lib/plans/config";

export function getUpgradeReason(planKey: MemberPlanKey | null | undefined) {
  const plan = getPlanConfig(planKey);

  if (plan.key === "free") {
    return "升級後可增加名片數量、移除浮水印，並開啟進階分享。";
  }

  if (plan.key === "starter") {
    return "升級到 Pro 可使用自訂公開識別與完整模板額度。";
  }

  return "你目前已是最高方案，可直接使用完整權益。";
}
