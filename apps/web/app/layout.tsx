import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Indek",
  description:
    "COD-native dispatch, rider, and merchant surfaces for multi-merchant UAE courier operations."
};

export default function RootLayout({
  children
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
