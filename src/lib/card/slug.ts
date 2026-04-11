import type { MemberPlanKey } from "@/lib/auth/types";
import { cardRepository } from "@/lib/card/repository";
import { canEditCustomSlug } from "@/lib/plans/features";

const MAX_SLUG_LENGTH = 48;
const AUTO_SUFFIX_LENGTH = 6;

export type SlugAvailability =
  | {
      available: true;
      slug: string;
    }
  | {
      available: false;
      slug: string;
      reason: "empty" | "format" | "conflict";
      message: string;
    };

export function normalizeCardSlug(value: string) {
  return value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "")
    .slice(0, MAX_SLUG_LENGTH);
}

export function isLikelyCardId(identifier: string) {
  const value = identifier.trim();

  return (
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value) ||
    /^card_[a-z0-9_]+$/i.test(value)
  );
}

export function buildFallbackSlugSource(input: {
  cardName?: string | null;
  displayName?: string | null;
}) {
  return input.cardName?.trim() || input.displayName?.trim() || "card";
}

export async function checkSlugAvailability(input: {
  slug: string;
  excludeCardId?: string | null;
}) {
  const normalized = normalizeCardSlug(input.slug);

  if (!normalized) {
    return {
      available: false,
      slug: "",
      reason: "empty",
      message: "Slug 不可為空，請輸入英數字與連字號。",
    } satisfies SlugAvailability;
  }

  if (normalized !== input.slug.trim().toLowerCase()) {
    return {
      available: false,
      slug: normalized,
      reason: "format",
      message: `Slug 只能使用英數字與連字號。可用格式：${normalized}`,
    } satisfies SlugAvailability;
  }

  const [records, publishedRecord] = await Promise.all([
    cardRepository.getAll(),
    cardRepository.getPublishedBySlug(normalized),
  ]);
  const ownConflict = records.find(
    (record) => record.slug.toLowerCase() === normalized && record.id !== input.excludeCardId,
  );

  if (ownConflict || (publishedRecord && publishedRecord.id !== input.excludeCardId)) {
    return {
      available: false,
      slug: normalized,
      reason: "conflict",
      message: `公開識別「${normalized}」已被使用，請改用其他 slug。`,
    } satisfies SlugAvailability;
  }

  return {
    available: true,
    slug: normalized,
  } satisfies SlugAvailability;
}

export async function resolveCardSlugForSave(input: {
  planKey: MemberPlanKey | null | undefined;
  desiredSlug?: string | null;
  fallbackSource: string;
  excludeCardId?: string | null;
  seed?: string | null;
}) {
  const fallbackBase = normalizeCardSlug(input.fallbackSource) || "card";
  const desired = normalizeCardSlug(input.desiredSlug || "");
  const canUseCustom = canEditCustomSlug(input.planKey);

  if (canUseCustom && desired) {
    const availability = await checkSlugAvailability({
      slug: desired,
      excludeCardId: input.excludeCardId,
    });

    if (!availability.available) {
      throw new Error(availability.message);
    }

    return {
      slug: availability.slug,
      source: "custom" as const,
      collisionsResolved: false,
    };
  }

  const candidates = buildAutoSlugCandidates(fallbackBase, input.seed);

  for (const candidate of candidates) {
    const availability = await checkSlugAvailability({
      slug: candidate,
      excludeCardId: input.excludeCardId,
    });

    if (availability.available) {
      return {
        slug: availability.slug,
        source: "auto" as const,
        collisionsResolved: availability.slug !== fallbackBase,
      };
    }
  }

  throw new Error("系統目前無法產生可用的公開 slug，請稍後再試。");
}

export function getSlugPreview(input: {
  planKey: MemberPlanKey | null | undefined;
  desiredSlug?: string | null;
  fallbackSource: string;
}) {
  const desired = normalizeCardSlug(input.desiredSlug || "");

  if (canEditCustomSlug(input.planKey) && desired) {
    return desired;
  }

  return normalizeCardSlug(input.fallbackSource) || "card";
}

export function isSlugConflictError(error: unknown) {
  if (!(error instanceof Error)) {
    return false;
  }

  return (
    error.message.includes("idx_cards_slug_unique") ||
    error.message.includes("duplicate key value violates unique constraint") ||
    error.message.includes("duplicate key")
  );
}

function buildAutoSlugCandidates(base: string, seed?: string | null) {
  const candidates = [base];
  const deterministicSuffix = buildShortSuffix(seed);

  if (deterministicSuffix) {
    candidates.push(appendSlugSuffix(base, deterministicSuffix));
  }

  for (let index = 0; index < 3; index += 1) {
    candidates.push(appendSlugSuffix(base, buildShortSuffix(`${seed || base}-${index}-${Date.now()}`)));
  }

  return Array.from(new Set(candidates));
}

function appendSlugSuffix(base: string, suffix: string) {
  const normalizedSuffix = normalizeCardSlug(suffix).replace(/-/g, "").slice(0, AUTO_SUFFIX_LENGTH);
  const trimmedBase = base.slice(0, Math.max(1, MAX_SLUG_LENGTH - normalizedSuffix.length - 1));

  return `${trimmedBase}-${normalizedSuffix}`;
}

function buildShortSuffix(value?: string | null) {
  if (!value) {
    return Math.random().toString(36).slice(2, 2 + AUTO_SUFFIX_LENGTH);
  }

  const normalized = normalizeCardSlug(value).replace(/-/g, "");

  if (normalized.length >= AUTO_SUFFIX_LENGTH) {
    return normalized.slice(0, AUTO_SUFFIX_LENGTH);
  }

  return `${normalized}${Math.random().toString(36).slice(2, 2 + AUTO_SUFFIX_LENGTH)}`.slice(
    0,
    AUTO_SUFFIX_LENGTH,
  );
}
