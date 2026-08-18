import type { Metadata, Viewport } from "next";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { t } from "@/lib/i18n";
import "./globals.css";

const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "https://bad-mvp.onrender.com";
const DESCRIPTION =
  "Витамины и БАД оригинальных брендов с документами и доставкой по Узбекистану. Показываем цену за действующее вещество.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: `${t.common.siteName} — витамины и БАД с доставкой по Узбекистану`,
    template: `%s — ${t.common.siteName}`,
  },
  description: DESCRIPTION,
  applicationName: t.common.siteName,
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: t.common.siteName,
    statusBarStyle: "default",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/apple-touch-icon.png",
  },
  // Без og-тегов ссылка в Telegram разворачивается серой пустышкой,
  // а товары в Узбекистане пересылают именно так.
  openGraph: {
    type: "website",
    locale: "ru_RU",
    url: SITE_URL,
    siteName: t.common.siteName,
    title: `${t.common.siteName} — витамины и БАД с доставкой по Узбекистану`,
    description: DESCRIPTION,
    images: [{ url: "/og-image.png", width: 1200, height: 630, alt: t.common.siteName }],
  },
  twitter: {
    card: "summary_large_image",
    title: `${t.common.siteName} — витамины и БАД с доставкой по Узбекистану`,
    description: DESCRIPTION,
    images: ["/og-image.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#ffffff",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className="antialiased min-h-screen flex flex-col">
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
