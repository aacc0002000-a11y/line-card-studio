import { redirect } from "next/navigation";
import { getCurrentProfile, getCurrentUser } from "@/lib/supabase/auth";

export async function requireAuthenticatedMember() {
  const user = await getCurrentUser();

  if (!user) {
    redirect("/login");
  }

  const profile = await getCurrentProfile();

  return {
    user,
    profile,
  };
}

export async function redirectAuthenticatedUser(defaultPath = "/dashboard") {
  const user = await getCurrentUser();

  if (user) {
    redirect(defaultPath);
  }
}
