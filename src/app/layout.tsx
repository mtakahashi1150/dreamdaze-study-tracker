import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";

const geist = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DREAMDAZE 学習トラッカー",
  description: "親子で学習時間をチェックイン・チェックアウト報告",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    title: "DD学習",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#6b4cf6",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="ja" className={`${geist.variable} h-full`}>
      <body className="min-h-full bg-zinc-50 font-sans text-zinc-900 antialiased dark:bg-zinc-950 dark:text-zinc-100">
        {children}
      </body>
    </html>
  );
}
