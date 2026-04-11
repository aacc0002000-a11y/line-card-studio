import type { MemberPlanKey } from "@/lib/auth/types";
import { syncOwnerPlanSnapshots } from "@/lib/card/publishing";
import {
  type CheckoutPlaceholder,
  type CheckoutPlaceholderStatus,
  type UpgradeIntent,
} from "@/lib/billing/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

function getPlanRank(planKey: MemberPlanKey) {
  switch (planKey) {
    case "free":
      return 0;
    case "starter":
      return 1;
    case "pro":
      return 2;
    default:
      return 0;
  }
}

async function getBillingClientOrThrow() {
  const client =
    typeof window === "undefined"
      ? await (await import("@/lib/supabase/server")).getSupabaseServerClient()
      : getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase client 未設定完成");
  }

  return client;
}

async function getAuthenticatedUserOrThrow() {
  const client = await getBillingClientOrThrow();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("請先登入後再升級方案");
  }

  return { client, user };
}

function createPlaceholderReference(userId: string, targetPlan: MemberPlanKey) {
  const randomPart = Math.random().toString(36).slice(2, 8);

  return `chk_${targetPlan}_${userId.slice(0, 6)}_${randomPart}`;
}

function mapIntentRow(row: {
  id: string;
  user_id: string;
  current_plan: MemberPlanKey;
  target_plan: MemberPlanKey;
  status: UpgradeIntent["status"];
  created_at: string;
}) {
  return {
    id: row.id,
    userId: row.user_id,
    currentPlan: row.current_plan,
    targetPlan: row.target_plan,
    status: row.status,
    createdAt: row.created_at,
  } satisfies UpgradeIntent;
}

function mapCheckoutRow(row: {
  id: string;
  user_id: string;
  intent_id: string;
  current_plan: MemberPlanKey;
  target_plan: MemberPlanKey;
  status: CheckoutPlaceholderStatus;
  provider: string;
  checkout_url: string | null;
  session_token: string | null;
  created_at: string;
  updated_at: string;
}) {
  return {
    id: row.id,
    userId: row.user_id,
    intentId: row.intent_id,
    currentPlan: row.current_plan,
    targetPlan: row.target_plan,
    status: row.status,
    provider: row.provider,
    checkoutUrl: row.checkout_url,
    sessionToken: row.session_token,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  } satisfies CheckoutPlaceholder;
}

export async function createCheckoutSession(input: {
  currentPlan: MemberPlanKey;
  targetPlan: MemberPlanKey;
}) {
  if (input.currentPlan === input.targetPlan) {
    throw new Error("你目前已在此方案。");
  }

  if (getPlanRank(input.targetPlan) <= getPlanRank(input.currentPlan)) {
    throw new Error("目前僅支援升級到更高方案。");
  }

  const { client, user } = await getAuthenticatedUserOrThrow();
  const intentResult = await client
    .from("upgrade_intents")
    .insert({
      user_id: user.id,
      current_plan: input.currentPlan,
      target_plan: input.targetPlan,
      status: "pending",
    })
    .select("id, user_id, current_plan, target_plan, status, created_at")
    .single();

  if (intentResult.error) {
    throw intentResult.error;
  }

  const placeholderResult = await client
    .from("checkout_placeholders")
    .insert({
      user_id: user.id,
      intent_id: intentResult.data.id,
      current_plan: input.currentPlan,
      target_plan: input.targetPlan,
      status: "checkout_ready",
      provider: "placeholder",
      checkout_url: `/upgrade?checkout=${intentResult.data.id}`,
      session_token: createPlaceholderReference(user.id, input.targetPlan),
    })
    .select(
      "id, user_id, intent_id, current_plan, target_plan, status, provider, checkout_url, session_token, created_at, updated_at",
    )
    .single();

  if (placeholderResult.error) {
    throw placeholderResult.error;
  }

  const profileUpdate = await client
    .from("profiles")
    .update({
      billing_status: "pending_upgrade",
    })
    .eq("id", user.id);

  if (profileUpdate.error) {
    throw profileUpdate.error;
  }

  return {
    intent: mapIntentRow(intentResult.data),
    checkout: mapCheckoutRow(placeholderResult.data),
    status: placeholderResult.data.status,
    billingStatus: "pending_upgrade" as const,
    checkoutUrl: placeholderResult.data.checkout_url,
    message: `已建立 ${input.targetPlan} 方案的 checkout 佔位流程。`,
  };
}

export async function handleCheckoutResult(input: {
  checkoutId: string;
  result: "submitted" | "processing" | "cancelled";
}) {
  const { client, user } = await getAuthenticatedUserOrThrow();
  const nextStatus: CheckoutPlaceholderStatus =
    input.result === "submitted"
      ? "pending_payment"
      : input.result === "processing"
        ? "upgrade_pending"
        : "cancelled";

  const checkoutUpdate = await client
    .from("checkout_placeholders")
    .update({
      status: nextStatus,
    })
    .eq("id", input.checkoutId)
    .eq("user_id", user.id)
    .select(
      "id, user_id, intent_id, current_plan, target_plan, status, provider, checkout_url, session_token, created_at, updated_at",
    )
    .single();

  if (checkoutUpdate.error) {
    throw checkoutUpdate.error;
  }

  return mapCheckoutRow(checkoutUpdate.data);
}

export async function syncPlanAfterUpgrade(input: {
  targetPlan: MemberPlanKey;
  checkoutId?: string | null;
}) {
  const { client, user } = await getAuthenticatedUserOrThrow();
  const profileUpdate = await client
    .from("profiles")
    .update({
      plan_key: input.targetPlan,
      billing_status: "active",
    })
    .eq("id", user.id)
    .select("plan_key, billing_status")
    .single();

  if (profileUpdate.error) {
    throw profileUpdate.error;
  }

  if (input.checkoutId) {
    const checkoutUpdate = await client
      .from("checkout_placeholders")
      .update({
        status: "completed",
      })
      .eq("id", input.checkoutId)
      .eq("user_id", user.id)
      .select("intent_id")
      .maybeSingle();

    if (checkoutUpdate.error) {
      throw checkoutUpdate.error;
    }

    if (checkoutUpdate.data?.intent_id) {
      const intentUpdate = await client
        .from("upgrade_intents")
        .update({
          status: "ready",
        })
        .eq("id", checkoutUpdate.data.intent_id)
        .eq("user_id", user.id);

      if (intentUpdate.error) {
        throw intentUpdate.error;
      }
    }
  }

  const syncedCards = await syncOwnerPlanSnapshots(input.targetPlan);

  return {
    planKey: profileUpdate.data.plan_key,
    billingStatus: profileUpdate.data.billing_status,
    syncedCards,
  };
}
