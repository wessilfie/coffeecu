import type { Metadata } from "next";
import { Newsreader, Manrope } from "next/font/google";
import Script from "next/script";
import "./globals.css";

const GA_ID = "G-0YGFM88PE4";

// ============================================================
// TYPOGRAPHY — Premium Editorial-Meets-Tech
// Newsreader: elegant, high-contrast serif for headings
// Manrope: sharp, geometric modern sans for body/UI text
// ============================================================

const newsreader = Newsreader({
  subsets: ["latin"],
  style: ["normal", "italic"],
  variable: "--font-newsreader",
  display: "swap",
});

const manrope = Manrope({
  subsets: ["latin"],
  variable: "--font-manrope",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Coffee@CU — Meet the Columbia Community",
  description:
    "Connect with Columbia University students, faculty, and alumni over coffee. One conversation at a time.",
  metadataBase: new URL(process.env.NEXT_PUBLIC_APP_URL ?? "https://coffeeatcu.com"),
  openGraph: {
    title: "Coffee@CU — Meet the Columbia Community",
    description:
      "Connect with students, faculty & alumni across every Columbia school. Verified @columbia.edu and @barnard.edu addresses only.",
    type: "website",
    siteName: "Coffee@CU",
  },
  twitter: {
    card: "summary_large_image",
    title: "Coffee@CU — Meet the Columbia Community",
    description:
      "Connect with students, faculty & alumni across every Columbia school. Verified @columbia.edu and @barnard.edu addresses only.",
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
      className={`${newsreader.variable} ${manrope.variable}`}
    >
      <body className="min-h-screen flex flex-col" suppressHydrationWarning>
        {children}
        <Script
          src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
          strategy="afterInteractive"
        />
        <Script id="ga4-init" strategy="afterInteractive">{`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${GA_ID}');
        `}</Script>
      </body>
    </html>
  );
}
