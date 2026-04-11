import type { CardTemplateOption } from "@/lib/card/types";

export const cardTemplates: CardTemplateOption[] = [
  {
    key: "portrait-center",
    name: "Portrait Center",
    description: "人物置中，資訊集中於下方，適合個人品牌與顧問型名片。",
    previewLabel: "中置人像",
  },
  {
    key: "top-cover",
    name: "Top Cover",
    description: "上方主視覺搭配卡片資訊區，適合品牌感較強的展示。",
    previewLabel: "封面型",
  },
  {
    key: "top-left-avatar",
    name: "Top Left Avatar",
    description: "左上頭像搭配資訊區塊，結構穩定，適合商務名片。",
    previewLabel: "商務型",
  },
  {
    key: "hero-split",
    name: "Hero Split",
    description: "左右分欄呈現主標與聯絡資訊，適合內容較多的版本。",
    previewLabel: "分欄型",
  },
];
