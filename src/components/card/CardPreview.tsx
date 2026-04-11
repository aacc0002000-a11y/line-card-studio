"use client";

import { HeroSplitCard } from "@/components/card/templates/HeroSplitCard";
import { Watermark } from "@/components/card/Watermark";
import { PortraitCenterCard } from "@/components/card/templates/PortraitCenterCard";
import { TopCoverCard } from "@/components/card/templates/TopCoverCard";
import { TopLeftAvatarCard } from "@/components/card/templates/TopLeftAvatarCard";
import { cardThemeMap } from "@/lib/card/themes";
import type {
  CardProfileData,
  CardTemplateComponent,
  CardTemplateKey,
} from "@/lib/card/types";

const templateMap: Record<CardTemplateKey, CardTemplateComponent> = {
  "portrait-center": PortraitCenterCard,
  "top-cover": TopCoverCard,
  "top-left-avatar": TopLeftAvatarCard,
  "hero-split": HeroSplitCard,
};

export function CardPreview({
  data,
  showWatermark = false,
}: {
  data: CardProfileData;
  showWatermark?: boolean;
}) {
  const Template = templateMap[data.templateKey];
  const theme = cardThemeMap[data.themeKey];

  return (
    <div>
      <Template data={data} theme={theme} />
      {showWatermark ? <Watermark /> : null}
    </div>
  );
}
