import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import ScrollProvider from "../components/ScrollProvider";

const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  "https://invoicementforge.up.railway.app";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "InvoiceForge | Proposal and GST Invoice Software",
    template: "%s | InvoiceForge",
  },
  description:
    "InvoiceForge is proposal and GST invoice software for Indian service businesses. Create proposals, collect signatures, manage clients, and send invoices.",
  applicationName: "InvoiceForge",
  keywords: [
    "InvoiceForge",
    "InvoicementForge",
    "proposal software",
    "GST invoice software",
    "invoice software India",
    "quotation software",
    "e-signature software",
    "client portal",
  ],
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
      "max-video-preview": -1,
    },
  },
  openGraph: {
    type: "website",
    url: "/",
    siteName: "InvoiceForge",
    title: "InvoiceForge | Proposal and GST Invoice Software",
    description:
      "Create proposals, collect signatures, manage clients, and send GST-ready invoices from one workspace.",
  },
  twitter: {
    card: "summary",
    title: "InvoiceForge | Proposal and GST Invoice Software",
    description:
      "Create proposals, collect signatures, manage clients, and send GST-ready invoices from one workspace.",
  },
  verification: process.env.GOOGLE_SITE_VERIFICATION
    ? { google: process.env.GOOGLE_SITE_VERIFICATION }
    : undefined,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
      data-scroll-behavior="smooth"
      suppressHydrationWarning
    >
      <head>
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-4585882044751118"
          crossOrigin="anonymous"
        />
      </head>
      <body className="min-h-full flex flex-col" suppressHydrationWarning>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify({
              "@context": "https://schema.org",
              "@type": "SoftwareApplication",
              name: "InvoiceForge",
              alternateName: "InvoicementForge",
              url: siteUrl,
              applicationCategory: "BusinessApplication",
              operatingSystem: "Web",
              description:
                "Proposal, e-signature, client portal, and GST invoice software for service businesses.",
              offers: {
                "@type": "Offer",
                price: "0",
                priceCurrency: "INR",
              },
            }).replace(/</g, "\\u003c"),
          }}
        />
        <ScrollProvider>{children}</ScrollProvider>
      </body>
    </html>
  );
}
