import type { MemberPlanKey } from "@/lib/auth/types";

const PLAN_LABELS: Record<MemberPlanKey, string> = {
  free: "Free",
  starter: "Starter",
  pro: "Pro",
};

export function MemberPlanBadge({ planKey }: { planKey: MemberPlanKey }) {
  return (
    <span className="inline-flex rounded-full bg-accent-soft px-3 py-1 text-xs font-semibold text-accent">
      {PLAN_LABELS[planKey] || planKey}
    </span>
  );
}
