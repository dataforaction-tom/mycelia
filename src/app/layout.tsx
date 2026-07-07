import type { Metadata } from "next";
import { Outfit, DM_Mono, Gloock } from "next/font/google";
import { siteConfig } from "@/lib/config/site";
import "./globals.css";

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

const dmMono = DM_Mono({
  variable: "--font-dm-mono",
  subsets: ["latin"],
  weight: ["400", "500"],
});

// Display face: Gloock's high-contrast serif carries the "grown, not
// typeset" typographic voice of the app.
const gloock = Gloock({
  variable: "--font-gloock",
  subsets: ["latin"],
  weight: "400",
});

export const metadata: Metadata = {
  metadataBase: new URL(siteConfig.url),
  title: {
    default: `${siteConfig.name} — tend your living network`,
    template: `%s · ${siteConfig.name}`,
  },
  description: siteConfig.description,
  keywords: [
    "relationship management",
    "CRM alternative",
    "social purpose organisations",
    "charity CRM",
    "community organising",
    "network mapping",
  ],
  openGraph: {
    type: "website",
    siteName: siteConfig.name,
    url: siteConfig.url,
    title: `${siteConfig.name} — tend your living network`,
    description: siteConfig.description,
  },
  twitter: {
    card: "summary_large_image",
    title: `${siteConfig.name} — tend your living network`,
    description: siteConfig.description,
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${outfit.variable} ${dmMono.variable} ${gloock.variable} antialiased`}>
        {children}
      </body>
    </html>
  );
}
