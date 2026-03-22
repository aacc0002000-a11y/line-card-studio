const CARD_API_BASE = process.env.NEXT_PUBLIC_CARD_API_BASE || "";

function normalizeBaseUrl(input: string) {
  return input.replace(/\/+$/, "");
}

export function getCardApiBase() {
  return CARD_API_BASE ? normalizeBaseUrl(CARD_API_BASE) : "";
}

export function buildPublicCardApiUrl(cardId: string) {
  const base = getCardApiBase();

  if (!base) {
    return "";
  }

  const url = new URL(base);
  url.searchParams.set("action", "getPublicCardJson");
  url.searchParams.set("cardId", cardId);

  return url.toString();
}

export async function fetchPublicCardFromApi(cardId: string) {
  const url = buildPublicCardApiUrl(cardId);

  if (!url) {
    return null;
  }

  const response = await fetch(url, {
    method: "GET",
    cache: "no-store",
    headers: {
      Accept: "application/json",
    },
  });

  if (!response.ok) {
    throw new Error(`Card API request failed with status ${response.status}`);
  }

  return response.json();
}
