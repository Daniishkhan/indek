import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import { cn } from "@/lib/utils";
import "./globals.css";

const inter = Inter({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal"],
  variable: "--font-inter",
  display: "swap"
});

const mono = JetBrains_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  style: ["normal"],
  variable: "--font-mono",
  display: "swap"
});

export const metadata: Metadata = {
  title: "Indek — COD operations for UAE courier fleets",
  description:
    "Chain-of-custody dispatch, rider, and merchant surfaces for multi-merchant UAE courier operations running cash-on-delivery."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      className={cn("font-sans", inter.variable, mono.variable)}
    >
      <body>{children}</body>
    </html>
  );
}
