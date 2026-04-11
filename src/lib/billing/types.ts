import type { BillingStatus, MemberPlanKey } from "@/lib/auth/types";

export type UpgradeIntentStatus = "draft" | "pending" | "ready" | "cancelled";
export type CheckoutPlaceholderStatus =
  | "pending_intent"
  | "checkout_ready"
  | "pending_payment"
  | "upgrade_pending"
  | "completed"
  | "cancelled";

export interface UpgradeIntent {
  id: string;
  userId: string;
  currentPlan: MemberPlanKey;
  targetPlan: MemberPlanKey;
  status: UpgradeIntentStatus;
  createdAt: string;
}

export interface CheckoutPlaceholder {
  id: string;
  userId: string;
  intentId: string;
  currentPlan: MemberPlanKey;
  targetPlan: MemberPlanKey;
  status: CheckoutPlaceholderStatus;
  provider: string;
  checkoutUrl: string | null;
  sessionToken: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface BillingPlaceholderState {
  currentPlan: MemberPlanKey;
  billingStatus: BillingStatus;
}

export interface BillingOverview extends BillingPlaceholderState {
  targetPlan: MemberPlanKey | null;
  intent: UpgradeIntent | null;
  checkout: CheckoutPlaceholder | null;
  flowTitle: string;
  flowDescription: string;
  ctaLabel: string;
  isUpgradeInProgress: boolean;
}
