import type { Metadata } from "next";
import "./globals.css";

import { SiteLayout } from "@/components/site-layout";
import { CookieConsent } from "@/components/cookie-consent";

export const metadata: Metadata = {
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_SITE_URL || "https://excursiiegipt.com",
  ),
  title: {
    default: "Excursii Egipt | Egypt Excursions",
    template: "%s | Excursii Egipt",
  },
  description:
    "Excursii și experiențe memorabile în Egipt. Discover Cairo, Luxor, Hurghada and the treasures of Egypt with local guides.",
  applicationName: "Excursii Egipt",
  openGraph: {
    type: "website",
    locale: "en_US",
    siteName: "Excursii Egipt",
    title: "Excursii Egipt",
    description: "Discover Egypt with carefully curated experiences.",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <SiteLayout>
          {children}
        </SiteLayout>
        <CookieConsent />
      </body>
    </html>
  );
}