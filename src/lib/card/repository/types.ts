import type {
  CardProfileData,
  CardStatus,
  SavedCardRecord,
} from "@/lib/card/types";

export interface CardRepository {
  getAll(): Promise<SavedCardRecord[]>;
  getById(id: string): Promise<SavedCardRecord | null>;
  getPublishedById(id: string): Promise<SavedCardRecord | null>;
  getPublishedBySlug(slug: string): Promise<SavedCardRecord | null>;
  create(
    data: CardProfileData,
    options?: { cardName?: string; status?: CardStatus; slug?: string; ownerPlanKey?: SavedCardRecord["ownerPlanKey"] },
  ): Promise<SavedCardRecord>;
  update(
    id: string,
    data: CardProfileData,
    options?: { cardName?: string; status?: CardStatus; slug?: string; ownerPlanKey?: SavedCardRecord["ownerPlanKey"] },
  ): Promise<SavedCardRecord | null>;
  save(record: SavedCardRecord): Promise<SavedCardRecord>;
  delete(id: string): Promise<boolean>;
  duplicate(id: string): Promise<SavedCardRecord | null>;
  publish(id: string): Promise<SavedCardRecord | null>;
  unpublish(id: string): Promise<SavedCardRecord | null>;
}
