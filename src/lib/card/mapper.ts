import { defaultCardName, defaultCardProfile } from "@/lib/card/defaults";
import type { MemberPlanKey } from "@/lib/auth/types";
import { cardTemplates } from "@/lib/card/templates";
import { cardThemes } from "@/lib/card/themes";
import type {
  CardProfileData,
  CardStatus,
  SavedCardRecord,
  CardTemplateKey,
  CardThemeKey,
} from "@/lib/card/types";

export function buildDefaultCardName(data: CardProfileData) {
  return `${data.displayName}的電子名片`;
}

export function buildDuplicateCardName(cardName: string) {
  return `${cardName}（副本）`;
}

export function getTemplateName(templateKey: CardTemplateKey) {
  return (
    cardTemplates.find((template) => template.key === templateKey)?.name ||
    templateKey
  );
}

export function getThemeName(themeKey: CardThemeKey) {
  return cardThemes.find((theme) => theme.key === themeKey)?.name || themeKey;
}

export function getStatusLabel(status: CardStatus) {
  return status === "published" ? "Published" : "Draft";
}

export function getStatusBadgeClassName(status: CardStatus) {
  return status === "published"
    ? "bg-emerald-50 text-emerald-700"
    : "bg-slate-100 text-slate-700";
}

export function formatCardDateTime(isoString: string) {
  try {
    return new Intl.DateTimeFormat("zh-TW", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
    }).format(new Date(isoString));
  } catch {
    return isoString;
  }
}

export function buildPublicCardDescription(record: SavedCardRecord) {
  const segments = [
    record.data.jobTitle,
    record.data.companyName,
    record.data.bio,
  ].filter((segment) => typeof segment === "string" && segment.trim().length > 0);

  return segments.join("｜") || `${record.data.displayName} 的電子名片`;
}

export function normalizeCardProfileData(value: unknown): CardProfileData {
  const source =
    value && typeof value === "object"
      ? (value as Partial<CardProfileData>)
      : ({} as Partial<CardProfileData>);

  return {
    ...defaultCardProfile,
    ...source,
    displayName: asString(source.displayName, defaultCardProfile.displayName),
    englishName: asString(source.englishName, defaultCardProfile.englishName),
    jobTitle: asString(source.jobTitle, defaultCardProfile.jobTitle),
    bio: asString(source.bio, defaultCardProfile.bio),
    companyName: asString(source.companyName, defaultCardProfile.companyName),
    address: asString(source.address, defaultCardProfile.address),
    email: asString(source.email, defaultCardProfile.email),
    phone: asString(source.phone, defaultCardProfile.phone),
    lineUrl: asString(source.lineUrl, defaultCardProfile.lineUrl),
    websiteUrl: asString(source.websiteUrl, defaultCardProfile.websiteUrl),
    primaryButtonLabel: asString(
      source.primaryButtonLabel,
      defaultCardProfile.primaryButtonLabel,
    ),
    primaryButtonUrl: asString(
      source.primaryButtonUrl,
      defaultCardProfile.primaryButtonUrl,
    ),
    secondaryButtonLabel: asString(
      source.secondaryButtonLabel,
      defaultCardProfile.secondaryButtonLabel,
    ),
    secondaryButtonUrl: asString(
      source.secondaryButtonUrl,
      defaultCardProfile.secondaryButtonUrl,
    ),
    avatarUrl: asString(source.avatarUrl, defaultCardProfile.avatarUrl),
    logoUrl: asString(source.logoUrl, defaultCardProfile.logoUrl),
    coverUrl: asString(source.coverUrl, defaultCardProfile.coverUrl),
    templateKey: isTemplateKey(source.templateKey)
      ? source.templateKey
      : defaultCardProfile.templateKey,
    themeKey: isThemeKey(source.themeKey)
      ? source.themeKey
      : defaultCardProfile.themeKey,
  };
}

export function normalizeSavedCardRecord(value: unknown): SavedCardRecord | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const source = value as Partial<SavedCardRecord> & {
    data?: unknown;
  };
  const data = normalizeCardProfileData(source.data);
  const createdAt = getIsoString(source.createdAt);
  const updatedAt = getIsoString(source.updatedAt) || createdAt;

  return {
    id: asString(source.id, ""),
    userId: asString(source.userId, "local-user"),
    slug: asString((source as SavedCardRecord & { slug?: string }).slug, ""),
    ownerPlanKey: asPlanKey((source as SavedCardRecord & { ownerPlanKey?: MemberPlanKey }).ownerPlanKey),
    cardName: asString(source.cardName, buildDefaultCardName(data) || defaultCardName),
    status: source.status === "published" ? "published" : "draft",
    createdAt,
    updatedAt,
    data,
  };
}

function asString(value: unknown, fallback: string) {
  return typeof value === "string" ? value : fallback;
}

function getIsoString(value: unknown) {
  if (typeof value === "string" && value.length > 0) {
    return value;
  }

  return new Date().toISOString();
}

function isTemplateKey(value: unknown): value is CardTemplateKey {
  return cardTemplates.some((template) => template.key === value);
}

function isThemeKey(value: unknown): value is CardThemeKey {
  return cardThemes.some((theme) => theme.key === value);
}

function asPlanKey(value: unknown): MemberPlanKey {
  return value === "starter" || value === "pro" ? value : "free";
}
