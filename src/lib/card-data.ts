import { fetchPublicCardFromApi } from "@/lib/card-api";
import {
  getStaticFallbackCardData,
  normalizePublicCardData,
  type NormalizedCardData,
} from "@/lib/card-normalize";

export async function fetchCardData(
  cardId = "default",
): Promise<NormalizedCardData> {
  try {
    const response = await fetchPublicCardFromApi(cardId);

    if (!response) {
      return getStaticFallbackCardData();
    }

    return normalizePublicCardData(response);
  } catch (error) {
    console.warn("Falling back to static card data", error);
    return getStaticFallbackCardData();
  }
}
