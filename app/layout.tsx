import type { Metadata } from "next";
import { Playfair_Display, Outfit } from "next/font/google";
import "./globals.css";
import { ToastProvider } from "@/components/Toast";
import { ClientLayoutWrapper } from "./ClientLayoutWrapper";

const playfair = Playfair_Display({
  subsets: ["latin"],
  variable: "--font-playfair",
  display: "swap",
});

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-outfit",
  display: "swap",
});

export const viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
};

export const metadata: Metadata = {
  title: "VIHARI'S EMBROIDERY • Beautiful Designs • Quality Embroidery",
  description:
    "Discover a curated digital collection of exquisite embroidery designs, bridal patterns, saree borders, and bespoke fashion motifs by Vihari's Embroidery.",
  manifest: "/manifest.json",
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
  keywords: [
    "embroidery designs",
    "embroidery catalog",
    "bridal embroidery",
    "saree borders",
    "blouse neck designs",
    "zardozi",
    "aari work",
  ],
};

import { AdminAuthProvider } from "@/lib/admin-auth";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${playfair.variable} ${outfit.variable}`}>
      <body className="bg-[#FAF8F5] text-[#1C1917] min-h-screen flex flex-col antialiased selection:bg-[#C5A059]/20 selection:text-[#1C1917]">
        <AdminAuthProvider>
          <ToastProvider>
            <ClientLayoutWrapper>{children}</ClientLayoutWrapper>
          </ToastProvider>
        </AdminAuthProvider>
      </body>
    </html>
  );
}
