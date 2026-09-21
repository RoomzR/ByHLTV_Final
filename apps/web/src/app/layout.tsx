import type { Metadata } from "next";
import { JetBrains_Mono, Open_Sans, Oswald } from "next/font/google";

import { AppShell } from "@/components/layout/app-shell";
import { SITE } from "@/lib/constants/navigation";

import "./globals.css";

const openSans = Open_Sans({
  variable: "--font-sora",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["400", "600", "700"],
});

const oswald = Oswald({
  variable: "--font-space",
  subsets: ["latin", "latin-ext", "cyrillic"],
  weight: ["500", "600", "700"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin", "latin-ext", "cyrillic"],
});

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — Беларускі Counter-Strike`,
    template: `%s · ${SITE.name}`,
  },
  description:
    "Новости белорусского Counter-Strike: матчи, трансферы, рейтинги и live-счёт региональной сцены.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/byhltv-mark.png", type: "image/png" },
    ],
    apple: [{ url: "/byhltv-mark.png" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="be"
      suppressHydrationWarning
      className={`${openSans.variable} ${oswald.variable} ${jetbrains.variable} h-full antialiased`}
    >
      <body className="min-h-full font-sans text-foreground" suppressHydrationWarning>
        <AppShell>{children}</AppShell>
      </body>
    </html>
  );
}
