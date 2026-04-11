import type { ComponentType } from "react";
import type { MemberPlanKey } from "@/lib/auth/types";

export type CardTemplateKey =
  | "portrait-center"
  | "top-cover"
  | "top-left-avatar"
  | "hero-split";

export type CardThemeKey =
  | "green"
  | "blue"
  | "red"
  | "orange"
  | "purple"
  | "black-gold"
  | "pink"
  | "beige";

export interface CardProfileData {
  displayName: string;
  englishName: string;
  jobTitle: string;
  bio: string;
  companyName: string;
  address: string;
  email: string;
  phone: string;
  lineUrl: string;
  websiteUrl: string;
  primaryButtonLabel: string;
  primaryButtonUrl: string;
  secondaryButtonLabel: string;
  secondaryButtonUrl: string;
  avatarUrl: string;
  logoUrl: string;
  coverUrl: string;
  templateKey: CardTemplateKey;
  themeKey: CardThemeKey;
}

export type CardStatus = "draft" | "published";

export interface SavedCardRecord {
  id: string;
  userId: string;
  slug: string;
  ownerPlanKey: MemberPlanKey;
  cardName: string;
  status: CardStatus;
  createdAt: string;
  updatedAt: string;
  data: CardProfileData;
}

export interface CardTemplateOption {
  key: CardTemplateKey;
  name: string;
  description: string;
  previewLabel: string;
}

export interface CardTheme {
  key: CardThemeKey;
  name: string;
  primary: string;
  secondary: string;
  background: string;
  surface: string;
  text: string;
  buttonText: string;
  mutedText: string;
  border: string;
}

export interface CardTemplateComponentProps {
  data: CardProfileData;
  theme: CardTheme;
}

export type CardTemplateComponent =
  ComponentType<CardTemplateComponentProps>;
