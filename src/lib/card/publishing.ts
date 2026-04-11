import {
  buildPublicCardDescription,
  buildDefaultCardName,
} from "@/lib/card/mapper";
import { cardRepository } from "@/lib/card/repository";
import type { SavedCardRecord } from "@/lib/card/types";
import type { MemberPlanKey } from "@/lib/auth/types";
import { isLikelyCardId, normalizeCardSlug } from "@/lib/card/slug";

export async function publishCard(id: string) {
  return cardRepository.publish(id);
}

export async function unpublishCard(id: string) {
  return cardRepository.unpublish(id);
}

export async function getPublishedCardById(id: string) {
  return cardRepository.getPublishedById(id);
}

export async function getPublishedCardBySlug(slug: string) {
  return cardRepository.getPublishedBySlug(normalizeCardSlug(slug));
}

export async function getPublishedCardByIdentifier(identifier: string) {
  const trimmed = identifier.trim();
  const normalizedSlug = normalizeCardSlug(trimmed);

  if (isLikelyCardId(trimmed)) {
    const byId = await getPublishedCardById(trimmed);

    if (byId) {
      return byId;
    }
  }

  if (normalizedSlug) {
    const bySlug = await getPublishedCardBySlug(normalizedSlug);

    if (bySlug) {
      return bySlug;
    }
  }

  if (!isLikelyCardId(trimmed)) {
    return getPublishedCardById(trimmed);
  }

  return null;
}

export function getPublicCardPath(input: string | Pick<SavedCardRecord, "id" | "slug">) {
  const identifier = typeof input === "string" ? input : input.slug.trim() || input.id;

  return `/p/${encodeURIComponent(identifier)}`;
}

export async function syncOwnerPlanSnapshots(planKey: MemberPlanKey) {
  const records = await cardRepository.getAll();
  const staleRecords = records.filter((record) => record.ownerPlanKey !== planKey);

  await Promise.all(
    staleRecords.map((record) =>
      cardRepository.save({
        ...record,
        ownerPlanKey: planKey,
        updatedAt: new Date().toISOString(),
      }),
    ),
  );

  return staleRecords.length;
}

export function buildPublicCardMetadata(record: SavedCardRecord) {
  const title =
    record.cardName.trim() || buildDefaultCardName(record.data) || record.data.displayName;
  const description = buildPublicCardDescription(record);

  return {
    title,
    description,
  };
}
