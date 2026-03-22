import { cardContent } from "@/data/card";

export type CardButton = {
  label: string;
  url: string;
};

export type NormalizedCardData = {
  cardId: string;
  brandName: string;
  headline: string;
  subheadline: string;
  intro: string;
  bullets: string[];
  photoUrl: string;
  photoAlt: string;
  shareImageUrl: string;
  shareImageAlt: string;
  description: string;
  themeColor: string;
  accentColor: string;
  buttonBgColor: string;
  buttonTextColor: string;
  buttons: CardButton[];
};

type PublicCardApiResponse = {
  ok?: boolean;
  card?: {
    cardId?: string;
    brandName?: string;
    headline?: string;
    subheadline?: string;
    intro?: string;
    photoUrl?: string;
    themeColor?: string;
    accentColor?: string;
    buttonBgColor?: string;
    buttonTextColor?: string;
    bullets?: string[];
    buttons?: CardButton[];
  };
};

function sanitizeButtons(buttons: CardButton[] | undefined) {
  return (buttons || [])
    .filter((button) => button?.label && button?.url)
    .slice(0, 4);
}

export function getStaticFallbackCardData(): NormalizedCardData {
  return {
    cardId: "default",
    brandName: cardContent.brandEn,
    headline: cardContent.heroTitle,
    subheadline: cardContent.displayName,
    intro: cardContent.intro,
    bullets: cardContent.bullets.slice(0, 3),
    photoUrl: cardContent.photoSrc,
    photoAlt: cardContent.photoAlt,
    shareImageUrl: cardContent.shareCardImageSrc,
    shareImageAlt: cardContent.shareCardImageAlt,
    description: cardContent.description,
    themeColor: "#172033",
    accentColor: "#0F766E",
    buttonBgColor: "#0F766E",
    buttonTextColor: "#FFFFFF",
    buttons: [
      {
        label: "前往 LINE 官方一探究竟",
        url: cardContent.links.lineUrl,
      },
      {
        label: "Wechat",
        url: cardContent.links.wechatUrl,
      },
      {
        label: "Facebook",
        url: cardContent.links.facebookUrl,
      },
      {
        label: "Phone",
        url: `tel:${cardContent.links.phone.replace(/\s+/g, "")}`,
      },
    ],
  };
}

export function normalizePublicCardData(
  response: PublicCardApiResponse | null | undefined,
): NormalizedCardData {
  const fallback = getStaticFallbackCardData();
  const card = response?.card;

  if (!response?.ok || !card) {
    return fallback;
  }

  const apiBullets = (card.bullets || []).filter(Boolean).slice(0, 3);
  const apiButtons = sanitizeButtons(card.buttons);

  return {
    cardId: card.cardId || fallback.cardId,
    brandName: card.brandName || fallback.brandName,
    headline: card.headline || fallback.headline,
    subheadline: card.subheadline || fallback.subheadline,
    intro: card.intro || fallback.intro,
    bullets: apiBullets.length ? apiBullets : fallback.bullets,
    photoUrl: card.photoUrl || fallback.photoUrl,
    photoAlt: fallback.photoAlt,
    shareImageUrl: card.photoUrl || fallback.shareImageUrl,
    shareImageAlt: fallback.shareImageAlt,
    description: fallback.description,
    themeColor: card.themeColor || fallback.themeColor,
    accentColor: card.accentColor || fallback.accentColor,
    buttonBgColor: card.buttonBgColor || fallback.buttonBgColor,
    buttonTextColor: card.buttonTextColor || fallback.buttonTextColor,
    buttons: apiButtons.length ? apiButtons : fallback.buttons,
  };
}

export function buildSeoContentFromCard(card: NormalizedCardData) {
  return {
    title: `${card.subheadline} | ${card.brandName}`,
    description: card.description,
    ogTitle: `${card.headline}｜${card.brandName}`,
    ogDescription: card.description,
    ogImage: "/og-image.svg",
  };
}
