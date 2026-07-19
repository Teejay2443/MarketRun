import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
import { BottomNav } from "@/components/bottom-nav";
import { Providers } from "@/components/providers";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "MarketRun - Community-Powered Shopping",
  description: "Someone is already at the market. Let them help you shop. A peer-to-peer community shopping platform powered by Monnify.",
  keywords: ["marketplace", "errands", "community", "shopping", "Nigeria", "Lagos"],
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
    >
      <body className="min-h-full flex flex-col">
        <Providers>
          <div className="flex-1 pb-16 md:pb-0">
            {children}
          </div>
          <BottomNav />
          <Toaster />
        </Providers>
      </body>
    </html>
  );
}
