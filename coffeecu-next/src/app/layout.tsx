import type { Metadata } from "next";
import { DM_Serif_Display, Lora, DM_Sans } from "next/font/google";
import "./globals.css";

// ============================================================
// TYPOGRAPHY — Limestone & Blue Design System
// DM Serif Display: high-contrast editorial serif for headings
// Lora: warm, readable serif for body copy
// DM Sans: clean geometric sans for UI labels, buttons, meta
//          (designed as the companion to DM Serif Display)
// ============================================================

const dmSerifDisplay = DM_Serif_Display({
  subsets: ["latin"],
  weight: ["400"],
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const dmSans = DM_Sans({
  subsets: ["latin"],
  weight: ["400", "500", "600"],
  variable: "--font-dm-sans",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coffee@CU — Meet the Columbia Community",
  description:
    "Connect with Columbia University students, faculty, and alumni over coffee. One conversation at a time.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://coffeecu.com"),
  openGraph: {
    title: "Coffee@CU",
    description: "Meet the Columbia community, one coffee at a time.",
    type: "website",
  },
  robots: { index: true, follow: true },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${dmSerifDisplay.variable} ${lora.variable} ${dmSans.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
