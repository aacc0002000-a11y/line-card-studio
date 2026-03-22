import type { Metadata } from "next";
import "./globals.css";
import {
  buildSeoContentFromCard,
  getStaticFallbackCardData,
} from "@/lib/card-normalize";

const seoContent = buildSeoContentFromCard(getStaticFallbackCardData());

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://example.com",
  ),
  title: seoContent.title,
  description: seoContent.description,
  openGraph: {
    title: seoContent.ogTitle,
    description: seoContent.ogDescription,
    images: [seoContent.ogImage],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seoContent.ogTitle,
    description: seoContent.ogDescription,
    images: [seoContent.ogImage],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-Hant" className="h-full antialiased">
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
