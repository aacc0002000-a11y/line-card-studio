import { createServerClient } from "@supabase/ssr";
import type { SupabaseClient } from "@supabase/supabase-js";
import { getSupabasePublicEnv } from "@/lib/supabase/env";

export async function getSupabaseServerClient(): Promise<SupabaseClient | null> {
  const env = getSupabasePublicEnv();

  if (!env.url || !env.anonKey) {
    return null;
  }

  const { cookies } = await import("next/headers");
  const cookieStore = await cookies();

  return createServerClient(env.url, env.anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(nextCookies) {
        try {
          nextCookies.forEach(({ name, value, options }) => {
            cookieStore.set(name, value, options);
          });
        } catch {
          // Server Components may not be able to set cookies. Middleware handles refresh.
        }
      },
    },
  });
}
