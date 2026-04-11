import type { User } from "@supabase/supabase-js";
import type { BillingStatus, MemberProfile, MemberPlanKey } from "@/lib/auth/types";
import { getSupabaseServerClient } from "@/lib/supabase/server";

type ProfileRow = {
  id: string;
  email: string;
  display_name: string | null;
  plan_key: MemberPlanKey | null;
  billing_status: BillingStatus | null;
  created_at: string;
  updated_at: string;
};

export async function getCurrentUser() {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const {
    data: { user },
  } = await supabase.auth.getUser();

  return user;
}

export async function getCurrentProfile() {
  const user = await getCurrentUser();

  if (!user) {
    return null;
  }

  return getProfileByUser(user);
}

export async function getProfileByUser(user: User): Promise<MemberProfile | null> {
  const supabase = await getSupabaseServerClient();

  if (!supabase) {
    return null;
  }

  const result = await supabase
    .from("profiles")
    .select("id, email, display_name, plan_key, billing_status, created_at, updated_at")
    .eq("id", user.id)
    .maybeSingle();

  if (result.error) {
    throw result.error;
  }

  return mapProfileRow(result.data, user);
}

function mapProfileRow(row: ProfileRow | null, user: User): MemberProfile {
  return {
    id: user.id,
    email: row?.email || user.email || "",
    displayName:
      row?.display_name ||
      user.user_metadata?.display_name ||
      user.email?.split("@")[0] ||
      "Member",
    planKey: row?.plan_key || "free",
    billingStatus: row?.billing_status || "inactive",
    createdAt: row?.created_at || new Date().toISOString(),
    updatedAt: row?.updated_at || new Date().toISOString(),
  };
}
