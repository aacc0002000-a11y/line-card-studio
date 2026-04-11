import type { UpgradeIntentStatus } from "@/lib/billing/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type { MemberPlanKey } from "@/lib/auth/types";

export async function createUpgradeIntent(input: {
  currentPlan: MemberPlanKey;
  targetPlan: MemberPlanKey;
  status?: UpgradeIntentStatus;
}) {
  const client = getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase Auth 尚未設定完成");
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    throw new Error("請先登入後再升級方案");
  }

  const result = await client
    .from("upgrade_intents")
    .insert({
      user_id: user.id,
      current_plan: input.currentPlan,
      target_plan: input.targetPlan,
      status: (input.status || "pending") satisfies UpgradeIntentStatus,
    })
    .select("id, status")
    .single();

  if (result.error) {
    throw result.error;
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

  return result.data;
}
