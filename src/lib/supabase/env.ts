export type CardRepositoryMode = "local" | "supabase";

export function getSupabasePublicEnv() {
  return {
    url: process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    anonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "",
    bucket: process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || "card-media",
    repositoryMode:
      process.env.NEXT_PUBLIC_CARD_REPOSITORY === "supabase"
        ? "supabase"
        : "local",
  } as const;
}

export function isSupabaseConfigured() {
  const env = getSupabasePublicEnv();

  return env.url.length > 0 && env.anonKey.length > 0;
}

export function getCardRepositoryMode(): CardRepositoryMode {
  const env = getSupabasePublicEnv();

  if (env.repositoryMode === "supabase" && isSupabaseConfigured()) {
    return "supabase";
  }

  return "local";
}
