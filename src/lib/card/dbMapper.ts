import type { MemberPlanKey } from "@/lib/auth/types";
import { buildDefaultCardName, normalizeCardProfileData } from "@/lib/card/mapper";
import type { SavedCardRecord, CardProfileData, CardStatus } from "@/lib/card/types";

export type CardRow = {
  id: string;
  user_id: string;
  slug: string;
  owner_plan_key: MemberPlanKey;
  card_name: string;
  status: CardStatus;
  template_key: string;
  theme_key: string;
  created_at: string;
  updated_at: string;
};

export type CardProfileRow = {
  card_id: string;
  display_name: string;
  english_name: string;
  job_title: string;
  bio: string;
  company_name: string;
  address: string;
  email: string;
  phone: string;
  line_url: string;
  website_url: string;
};

export type CardMediaRow = {
  card_id: string;
  avatar_url: string;
  logo_url: string;
  cover_url: string;
};

export type CardButtonsRow = {
  card_id: string;
  primary_button_label: string;
  primary_button_url: string;
  secondary_button_label: string;
  secondary_button_url: string;
};

export type SupabaseCardAggregateRow = CardRow & {
  card_profile?: CardProfileRow | CardProfileRow[] | null;
  card_media?: CardMediaRow | CardMediaRow[] | null;
  card_buttons?: CardButtonsRow | CardButtonsRow[] | null;
};

export function mapRecordToDbRows(record: SavedCardRecord) {
  const { data } = record;

  return {
    cardRow: {
      id: record.id,
      user_id: record.userId,
      slug: record.slug,
      owner_plan_key: record.ownerPlanKey,
      card_name: record.cardName,
      status: record.status,
      template_key: data.templateKey,
      theme_key: data.themeKey,
      created_at: record.createdAt,
      updated_at: record.updatedAt,
    } satisfies CardRow,
    profileRow: {
      card_id: record.id,
      display_name: data.displayName,
      english_name: data.englishName,
      job_title: data.jobTitle,
      bio: data.bio,
      company_name: data.companyName,
      address: data.address,
      email: data.email,
      phone: data.phone,
      line_url: data.lineUrl,
      website_url: data.websiteUrl,
    } satisfies CardProfileRow,
    mediaRow: {
      card_id: record.id,
      avatar_url: data.avatarUrl,
      logo_url: data.logoUrl,
      cover_url: data.coverUrl,
    } satisfies CardMediaRow,
    buttonsRow: {
      card_id: record.id,
      primary_button_label: data.primaryButtonLabel,
      primary_button_url: data.primaryButtonUrl,
      secondary_button_label: data.secondaryButtonLabel,
      secondary_button_url: data.secondaryButtonUrl,
    } satisfies CardButtonsRow,
  };
}

export function mapAggregateRowToSavedCardRecord(row: SupabaseCardAggregateRow): SavedCardRecord {
  const profile = getSingleRow(row.card_profile);
  const media = getSingleRow(row.card_media);
  const buttons = getSingleRow(row.card_buttons);

  const data = normalizeCardProfileData({
    displayName: profile?.display_name,
    englishName: profile?.english_name,
    jobTitle: profile?.job_title,
    bio: profile?.bio,
    companyName: profile?.company_name,
    address: profile?.address,
    email: profile?.email,
    phone: profile?.phone,
    lineUrl: profile?.line_url,
    websiteUrl: profile?.website_url,
    primaryButtonLabel: buttons?.primary_button_label,
    primaryButtonUrl: buttons?.primary_button_url,
    secondaryButtonLabel: buttons?.secondary_button_label,
    secondaryButtonUrl: buttons?.secondary_button_url,
    avatarUrl: media?.avatar_url,
    logoUrl: media?.logo_url,
    coverUrl: media?.cover_url,
    templateKey: row.template_key,
    themeKey: row.theme_key,
  });

  return {
    id: row.id,
    userId: row.user_id,
    slug: row.slug || "",
    ownerPlanKey: row.owner_plan_key || "free",
    cardName: row.card_name || buildDefaultCardName(data),
    status: row.status === "published" ? "published" : "draft",
    createdAt: row.created_at,
    updatedAt: row.updated_at,
    data,
  };
}

export function buildSavedCardRecord(input: {
  id: string;
  userId: string;
  slug: string;
  ownerPlanKey: MemberPlanKey;
  cardName?: string;
  status?: CardStatus;
  createdAt?: string;
  updatedAt?: string;
  data: CardProfileData;
}) {
  const now = new Date().toISOString();

  return {
    id: input.id,
    userId: input.userId,
    slug: input.slug,
    ownerPlanKey: input.ownerPlanKey,
    cardName: input.cardName?.trim() || buildDefaultCardName(input.data),
    status: input.status || "draft",
    createdAt: input.createdAt || now,
    updatedAt: input.updatedAt || now,
    data: input.data,
  } satisfies SavedCardRecord;
}

function getSingleRow<T>(value: T | T[] | null | undefined) {
  if (Array.isArray(value)) {
    return value[0] || null;
  }

  return value || null;
}
