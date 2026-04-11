export type MemberPlanKey = "free" | "starter" | "pro";
export type BillingStatus = "inactive" | "pending_upgrade" | "active" | "past_due";

export interface MemberProfile {
  id: string;
  email: string;
  displayName: string;
  planKey: MemberPlanKey;
  billingStatus: BillingStatus;
  createdAt: string;
  updatedAt: string;
}
