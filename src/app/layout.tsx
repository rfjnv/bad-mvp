import type { Metadata } from "next";
import Header from "@/components/Header";
import { t } from "@/lib/i18n";
import "./globals.css";

export const metadata: Metadata = {
  title: t.common.siteName,
  description: "Витамины и БАД с доставкой по Узбекистану",
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
      </body>
    </html>
  );
}
