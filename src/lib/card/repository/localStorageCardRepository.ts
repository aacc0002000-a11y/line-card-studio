import {
  buildDefaultCardName,
  buildDuplicateCardName,
  normalizeSavedCardRecord,
} from "@/lib/card/mapper";
import type { CardRepository } from "@/lib/card/repository/types";
import type {
  CardProfileData,
  CardStatus,
  SavedCardRecord,
} from "@/lib/card/types";

const CARD_STORAGE_KEY = "line-card-studio.saved-cards";
const CARD_STORAGE_EVENT = "line-card-studio.cards-updated";

function canUseStorage() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function generateCardId() {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }

  return `card_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
}

function readRecords() {
  if (!canUseStorage()) {
    return [] as SavedCardRecord[];
  }

  try {
    return getEmptySafeArray(window.localStorage.getItem(CARD_STORAGE_KEY));
  } catch {
    return [];
  }
}

function writeRecords(records: SavedCardRecord[]) {
  if (!canUseStorage()) {
    return;
  }

  try {
    window.localStorage.setItem(CARD_STORAGE_KEY, JSON.stringify(records));
    window.dispatchEvent(new Event(CARD_STORAGE_EVENT));
  } catch {
    // Swallow localStorage quota and serialization errors for this MVP.
  }
}

export function getEmptySafeArray(rawValue?: string | null) {
  if (!rawValue) {
    return [] as SavedCardRecord[];
  }

  try {
    const parsed: unknown = JSON.parse(rawValue);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed
      .map((item) => normalizeSavedCardRecord(item))
      .filter((item): item is SavedCardRecord => Boolean(item))
      .filter((item) => item.id.length > 0);
  } catch {
    return [];
  }
}

async function updateStatus(id: string, status: CardStatus) {
  const existing = await localStorageCardRepository.getById(id);

  if (!existing) {
    return null;
  }

  return localStorageCardRepository.save({
    ...existing,
    status,
    updatedAt: new Date().toISOString(),
  });
}

export const localStorageCardRepository: CardRepository = {
  async getAll() {
    return readRecords().sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  },

  async getById(id: string) {
    return readRecords().find((record) => record.id === id) || null;
  },

  async getPublishedById(id: string) {
    const record = await this.getById(id);

    return record?.status === "published" ? record : null;
  },

  async getPublishedBySlug(slug: string) {
    return readRecords().find((record) => record.slug === slug && record.status === "published") || null;
  },

  async create(
    data: CardProfileData,
    options?: { cardName?: string; status?: CardStatus; slug?: string; ownerPlanKey?: SavedCardRecord["ownerPlanKey"] },
  ) {
    const timestamp = new Date().toISOString();
    const record: SavedCardRecord = {
      id: generateCardId(),
      userId: "local-user",
      slug: options?.slug || "",
      ownerPlanKey: options?.ownerPlanKey || "free",
      cardName: options?.cardName?.trim() || buildDefaultCardName(data),
      status: options?.status || "draft",
      createdAt: timestamp,
      updatedAt: timestamp,
      data,
    };

    return this.save(record);
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

    const nextRecord: SavedCardRecord = {
      ...existing,
      slug: options?.slug || existing.slug,
      ownerPlanKey: options?.ownerPlanKey || existing.ownerPlanKey,
      cardName:
        options?.cardName?.trim() || existing.cardName || buildDefaultCardName(data),
      status: options?.status || existing.status,
      updatedAt: new Date().toISOString(),
      data,
    };

    return this.save(nextRecord);
  },

  async save(record: SavedCardRecord) {
    const records = readRecords();
    const index = records.findIndex((item) => item.id === record.id);

    if (index >= 0) {
      records[index] = record;
    } else {
      records.unshift(record);
    }

    writeRecords(records);

    return record;
  },

  async delete(id: string) {
    const records = readRecords();
    const nextRecords = records.filter((record) => record.id !== id);

    if (nextRecords.length === records.length) {
      return false;
    }

    writeRecords(nextRecords);

    return true;
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

export function subscribeToLocalStorageCards(callback: () => void) {
  if (!canUseStorage()) {
    return () => {};
  }

  const handleChange = () => callback();

  window.addEventListener("storage", handleChange);
  window.addEventListener(CARD_STORAGE_EVENT, handleChange);

  return () => {
    window.removeEventListener("storage", handleChange);
    window.removeEventListener(CARD_STORAGE_EVENT, handleChange);
  };
}
