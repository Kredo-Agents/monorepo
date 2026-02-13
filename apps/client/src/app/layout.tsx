import type { Metadata } from "next";
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
  title: "Kredo - AI Agent Control Center",
  description: "Give OpenClaw a cloud-native home. One deployment, unlimited conversations across Web, Element, Slack, and more.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en">
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
