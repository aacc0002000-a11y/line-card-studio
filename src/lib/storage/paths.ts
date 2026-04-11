type CardImageField = "avatar" | "logo" | "cover";

export function buildCardStoragePath(input: {
  userId: string;
  cardId?: string;
  field: CardImageField;
  extension: string;
}) {
  const safeExtension = input.extension.replace(/[^a-z0-9]/gi, "").toLowerCase() || "jpg";
  const cardSegment = input.cardId || "draft";

  return `users/${input.userId}/cards/${cardSegment}/${input.field}-${Date.now()}.${safeExtension}`;
}
