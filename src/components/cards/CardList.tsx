"use client";

import { CardListItem } from "@/components/cards/CardListItem";
import type { SavedCardRecord } from "@/lib/card/types";

export function CardList({
  records,
  onDuplicate,
  onDelete,
  disableDuplicate = false,
}: {
  records: SavedCardRecord[];
  onDuplicate: (id: string) => void;
  onDelete: (id: string) => void;
  disableDuplicate?: boolean;
}) {
  return (
    <div className="grid gap-4">
      {records.map((record) => (
        <CardListItem
          key={record.id}
          record={record}
          onDuplicate={onDuplicate}
          onDelete={onDelete}
          disableDuplicate={disableDuplicate}
        />
      ))}
    </div>
  );
}
