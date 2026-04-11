import { buildDuplicateCardName } from "@/lib/card/mapper";
import {
  buildSavedCardRecord,
  mapAggregateRowToSavedCardRecord,
  mapRecordToDbRows,
  type SupabaseCardAggregateRow,
} from "@/lib/card/dbMapper";
import type { CardRepository } from "@/lib/card/repository/types";
import { getSupabaseBrowserClient } from "@/lib/supabase/client";
import type {
  CardProfileData,
  CardStatus,
  SavedCardRecord,
} from "@/lib/card/types";

const CARD_SELECT = `
  id,
  user_id,
  slug,
  owner_plan_key,
  card_name,
  status,
  template_key,
  theme_key,
  created_at,
  updated_at,
  card_profile(display_name, english_name, job_title, bio, company_name, address, email, phone, line_url, website_url),
  card_media(avatar_url, logo_url, cover_url),
  card_buttons(primary_button_label, primary_button_url, secondary_button_label, secondary_button_url)
`;

async function getClientOrThrow() {
  const client =
    typeof window === "undefined"
      ? await (await import("@/lib/supabase/server")).getSupabaseServerClient()
      : getSupabaseBrowserClient();

  if (!client) {
    throw new Error("Supabase client 未設定完成");
  }

  return client;
}

async function getCurrentUserId() {
  const client = await getClientOrThrow();
  const {
    data: { user },
    error,
  } = await client.auth.getUser();

  if (error) {
    throw error;
  }

  if (!user) {
    throw new Error("請先登入後再管理名片");
  }

  return user.id;
}

async function getCurrentOwnerPlanKey() {
  const client = await getClientOrThrow();
  const {
    data: { user },
  } = await client.auth.getUser();

  if (!user) {
    throw new Error("請先登入後再管理名片");
  }

  const profileResult = await client
    .from("profiles")
    .select("plan_key")
    .eq("id", user.id)
    .maybeSingle();

  if (profileResult.error) {
    throw profileResult.error;
  }

  return profileResult.data?.plan_key || "free";
}

function generateCardId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

async function upsertRecord(record: SavedCardRecord) {
  const client = await getClientOrThrow();
  const { cardRow, profileRow, mediaRow, buttonsRow } = mapRecordToDbRows(record);

  const cardResult = await client
    .from("cards")
    .upsert(cardRow, { onConflict: "id" })
    .select()
    .single();

  if (cardResult.error) {
    throw cardResult.error;
  }

  const [profileResult, mediaResult, buttonsResult] = await Promise.all([
    client.from("card_profile").upsert(profileRow, { onConflict: "card_id" }),
    client.from("card_media").upsert(mediaRow, { onConflict: "card_id" }),
    client.from("card_buttons").upsert(buttonsRow, { onConflict: "card_id" }),
  ]);

  if (profileResult.error) {
    throw profileResult.error;
  }

  if (mediaResult.error) {
    throw mediaResult.error;
  }

  if (buttonsResult.error) {
    throw buttonsResult.error;
  }

  return record;
}

async function updateStatus(id: string, status: CardStatus) {
  const existing = await supabaseCardRepository.getById(id);

  if (!existing) {
    return null;
  }

  return upsertRecord({
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export const supabaseCardRepository: CardRepository = {
  async getAll() {
    const client = await getClientOrThrow();
    const userId = await getCurrentUserId();
    const result = await client
      .from("cards")
      .select(CARD_SELECT)
      .eq("user_id", userId)
      .order("updated_at", { ascending: false });

    if (result.error) {
      throw result.error;
    }

    return (result.data || []).map((row) =>
      mapAggregateRowToSavedCardRecord(row as SupabaseCardAggregateRow),
    );
  },

  async getById(id: string) {
    const client = await getClientOrThrow();
    const userId = await getCurrentUserId();
    const result = await client
      .from("cards")
      .select(CARD_SELECT)
      .eq("id", id)
      .eq("user_id", userId)
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return null;
    }

    return mapAggregateRowToSavedCardRecord(result.data as SupabaseCardAggregateRow);
  },

  async getPublishedById(id: string) {
    const client = await getClientOrThrow();
    const result = await client
      .from("cards")
      .select(CARD_SELECT)
      .eq("id", id)
      .eq("status", "published")
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return null;
    }

    return mapAggregateRowToSavedCardRecord(result.data as SupabaseCardAggregateRow);
  },

  async getPublishedBySlug(slug: string) {
    const client = await getClientOrThrow();
    const result = await client
      .from("cards")
      .select(CARD_SELECT)
      .eq("slug", slug)
      .eq("status", "published")
      .maybeSingle();

    if (result.error) {
      throw result.error;
    }

    if (!result.data) {
      return null;
    }

    return mapAggregateRowToSavedCardRecord(result.data as SupabaseCardAggregateRow);
  },

  async create(
    data: CardProfileData,
    options?: { cardName?: string; status?: CardStatus; slug?: string; ownerPlanKey?: SavedCardRecord["ownerPlanKey"] },
  ) {
    const record = buildSavedCardRecord({
      id: generateCardId(),
      userId: await getCurrentUserId(),
      slug: options?.slug || "",
      ownerPlanKey: options?.ownerPlanKey || await getCurrentOwnerPlanKey(),
      cardName: options?.cardName,
      status: options?.status,
      data,
    });

    return upsertRecord(record);
  },

  async update(
    id: string,
    data: CardProfileData,
    options?: { cardName?: string; status?: CardStatus; slug?: string; ownerPlanKey?: SavedCardRecord["ownerPlanKey"] },
  ) {
    const existing = await this.getById(id);

    if (!existing) {
      return null;
    }

    const record = buildSavedCardRecord({
      id,
      userId: existing.userId,
      slug: options?.slug || existing.slug,
      ownerPlanKey: options?.ownerPlanKey || existing.ownerPlanKey,
      cardName: options?.cardName || existing.cardName,
      status: options?.status || existing.status,
      createdAt: existing.createdAt,
      updatedAt: new Date().toISOString(),
      data,
    });

    return upsertRecord(record);
  },

  async save(record: SavedCardRecord) {
    return upsertRecord(record);
  },

  async delete(id: string) {
    const client = await getClientOrThrow();
    const userId = await getCurrentUserId();
    const result = await client.from("cards").delete().eq("id", id).eq("user_id", userId).select("id");

    if (result.error) {
      throw result.error;
    }

    return (result.data || []).length > 0;
  },

  async duplicate(id: string) {
    const existing = await this.getById(id);

    if (!existing) {
      return null;
    }

    return this.create(existing.data, {
      cardName: buildDuplicateCardName(existing.cardName),
      status: "draft",
      slug: "",
      ownerPlanKey: existing.ownerPlanKey,
    });
  },

  async publish(id: string) {
    return updateStatus(id, "published");
  },

  async unpublish(id: string) {
    return updateStatus(id, "draft");
  },
};
