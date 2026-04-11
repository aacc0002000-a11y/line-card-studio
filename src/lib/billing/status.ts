import type { MemberPlanKey } from "@/lib/auth/types";
import {
  type BillingOverview,
  type CheckoutPlaceholder,
  type CheckoutPlaceholderStatus,
  type UpgradeIntent,
} from "@/lib/billing/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";

async function getBillingClient() {
  const client =
    typeof window === "undefined"
      ? await (await import("@/lib/supabase/server")).getSupabaseServerClient()
      : getSupabaseBrowserClient();

  return client;
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

function getFlowCopy(checkout: CheckoutPlaceholder | null, intent: UpgradeIntent | null) {
  if (checkout) {
    switch (checkout.status) {
      case "pending_intent":
        return {
          title: "等待建立 checkout",
          description: "已記錄升級意圖，下一步會建立正式金流 provider session。",
          ctaLabel: "建立 checkout placeholder",
        };
      case "checkout_ready":
        return {
          title: "Checkout 已就緒",
          description: "已建立 checkout placeholder，可於下一包接正式 provider session。",
          ctaLabel: "前往 checkout",
        };
      case "pending_payment":
        return {
          title: "等待付款結果",
          description: "目前停在付款結果待確認階段，尚未切換正式方案。",
          ctaLabel: "查看付款狀態",
        };
      case "upgrade_pending":
        return {
          title: "等待升級同步",
          description: "付款成功後將由 provider callback 或後台作業同步方案與 owner plan 快照。",
          ctaLabel: "等待同步",
        };
      case "completed":
        return {
          title: "升級已同步",
          description: "方案資料與 owner plan 快照已同步完成。",
          ctaLabel: "查看方案",
        };
      case "cancelled":
        return {
          title: "升級流程已取消",
          description: "本次 checkout placeholder 已取消，可重新建立新的升級流程。",
          ctaLabel: "重新建立流程",
        };
      default:
        break;
    }
  }

  if (intent) {
    return {
      title: "已建立升級意圖",
      description: "目前僅建立 upgrade intent，尚未產生 checkout placeholder。",
      ctaLabel: "建立 checkout",
    };
  }

  return {
    title: "尚無升級流程",
    description: "目前沒有進行中的 checkout placeholder 或升級意圖。",
    ctaLabel: "開始升級",
  };
}

export async function getCurrentBillingOverview(): Promise<BillingOverview | null> {
  const client = await getBillingClient();

  if (!client) {
    return null;
  }

  const {
    data: { user },
    error: userError,
  } = await client.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return null;
  }

  const [profileResult, intentResult, checkoutResult] = await Promise.all([
    client
      .from("profiles")
      .select("plan_key, billing_status")
      .eq("id", user.id)
      .maybeSingle(),
    client
      .from("upgrade_intents")
      .select("id, user_id, current_plan, target_plan, status, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
    client
      .from("checkout_placeholders")
      .select(
        "id, user_id, intent_id, current_plan, target_plan, status, provider, checkout_url, session_token, created_at, updated_at",
      )
      .eq("user_id", user.id)
      .order("updated_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (intentResult.error) {
    throw intentResult.error;
  }

  if (checkoutResult.error) {
    throw checkoutResult.error;
  }

  const profile = profileResult.data;
  const intent = intentResult.data ? mapIntentRow(intentResult.data) : null;
  const checkout = checkoutResult.data ? mapCheckoutRow(checkoutResult.data) : null;
  const copy = getFlowCopy(checkout, intent);

  return {
    currentPlan: profile?.plan_key || "free",
    billingStatus: profile?.billing_status || "inactive",
    intent,
    checkout,
    flowTitle: copy.title,
    flowDescription: copy.description,
    ctaLabel: copy.ctaLabel,
    targetPlan: checkout?.targetPlan || intent?.targetPlan || null,
    isUpgradeInProgress:
      Boolean(intent) &&
      (profile?.billing_status === "pending_upgrade" ||
        (checkout?.status ? checkout.status !== "completed" && checkout.status !== "cancelled" : true)),
  };
}
