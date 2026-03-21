export type CardContent = {
  brandEn: string;
  heroTitle: string;
  displayName: string;
  intro: string;
  bullets: string[];
  description: string;
  photoAlt: string;
  photoSrc: string;
  links: {
    lineUrl: string;
    wechatUrl: string;
    facebookUrl: string;
    phone: string;
  };
};

export const cardContent: CardContent = {
  brandEn: "SHUANG MU LIN",
  heroTitle: "讓LINE變會賺錢好員工",
  displayName: "老闆營運的好夥伴－晏珊",
  intro:
    "我是晏珊，專門協助老闆把 LINE 官方帳號＋營運流程，變成「會帶客、會回流」的好員工。我的目標是幫助企業把接待、導購、回流與轉介紹流程更自動化。",
  bullets: [
    "看懂自己的客群與賣點",
    "設計好用又會成交的 LINE 版面",
    "搭建預約、通知、回流、自動化流程",
    "協助品牌把 LINE 變成 24 小時營運助手",
  ],
  description:
    "SHUANG MU LIN 的 LINE 電子名片，協助品牌把 LINE 官方帳號與營運流程變成會帶客、會回流的營運助手。",
  photoAlt: "晏珊電子名片照片",
  photoSrc: "/card-photo-placeholder.svg",
  links: {
    lineUrl: "https://line.me/ti/p/REPLACE_ME",
    wechatUrl: "https://wechat.com/REPLACE_ME",
    facebookUrl: "https://facebook.com/REPLACE_ME",
    phone: "0912345678",
  },
};

export const seoContent = {
  title: `${cardContent.displayName} | ${cardContent.brandEn}`,
  description: cardContent.description,
  ogTitle: `${cardContent.heroTitle}｜${cardContent.brandEn}`,
  ogDescription: cardContent.description,
  ogImage: "/og-image.svg",
};
