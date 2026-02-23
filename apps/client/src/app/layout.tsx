import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { TrpcProvider } from "@/components/providers/TrpcProvider";
import { ClerkProvider } from "@clerk/nextjs";
import RootNav from "@/components/layout/RootNav";
import RootFooter from "@/components/layout/RootFooter";


const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Kredo - AI Agents for the Masses",
  description: "Powerful AI agents, built for everyone. Deploy, manage, and scale intelligent agents without the complexity.",
  manifest: "/manifest.json",
  openGraph: {
    images: [{ url: "/og-image-twitter.png" }],
  },
  twitter: {
    card: "summary",
    images: [{ url: "/og-square.png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Kredo",
    statusBarStyle: "black-translucent",
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
  themeColor: "#09090b",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="apple-touch-icon" sizes="180x180" href="/apple-icon-180x180.png" />
          <link rel="apple-touch-icon" sizes="152x152" href="/apple-icon-152x152.png" />
          <link rel="apple-touch-icon" sizes="120x120" href="/apple-icon-120x120.png" />
        </head>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased dark:bg-zinc-950`}
        >
          <TrpcProvider>
            <div className="min-h-screen flex flex-col bg-gradient-to-b from-zinc-50 to-white dark:from-zinc-950 dark:to-black">
              <RootNav />
              <main className="flex-1">{children}</main>
              <RootFooter />
            </div>
          </TrpcProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}
