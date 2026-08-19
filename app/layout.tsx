import type { Metadata, Viewport } from "next";
import { Fraunces, IBM_Plex_Mono, Inter } from "next/font/google";
import "./globals.css";

const fraunces = Fraunces({
  subsets: ["latin"],
  weight: ["500", "600"],
  variable: "--font-display",
});

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-body",
});

const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  title: "Kapmenü",
  description: "Restoranlar için QR kodlu dijital menü sistemi",
};

export const viewport: Viewport = {
  // viewportFit: iPhone'da çentik/home indicator bölgesi de sayfaya dahil olur;
  // sabit konumlu öğeler env(safe-area-inset-*) ile o bölgeden uzak tutuluyor.
  // Yakınlaştırma bilerek kısıtlanmadı: müşteri menüde fiyat okurken
  // parmakla büyütebilmeli.
  viewportFit: "cover",
  themeColor: "#14100C",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="tr">
      <body
        className={`${fraunces.variable} ${inter.variable} ${plexMono.variable} antialiased`}
        style={{ fontFamily: "var(--font-body)" }}
      >
        {children}
      </body>
    </html>
  );
}
