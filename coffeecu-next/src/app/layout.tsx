import type { Metadata } from "next";
import { Cormorant_Garamond, Lora, Courier_Prime } from "next/font/google";
import "./globals.css";

// ============================================================
// TYPOGRAPHY — Limestone & Blue Design System
// Cormorant Garamond: university press, law review gravitas
// Lora: warm, readable serif for body copy
// Courier Prime: typewritten campus memo for labels & meta
// ============================================================

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-cormorant",
  display: "swap",
});

const lora = Lora({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-lora",
  display: "swap",
});

const courierPrime = Courier_Prime({
  subsets: ["latin"],
  weight: ["400", "700"],
  variable: "--font-courier",
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
      className={`${cormorant.variable} ${lora.variable} ${courierPrime.variable}`}
    >
      <body className="min-h-screen flex flex-col">
        {children}
      </body>
    </html>
  );
}
