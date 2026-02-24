import type { Metadata, Viewport } from "next";
import { Lexend_Deca } from "next/font/google";
import "./globals.css";
import { DayDetailSheetProvider } from "@/contexts/day-detail-sheet";
import { LogSheetProvider } from "@/contexts/log-sheet";
import { BottomNav } from "@/components/BottomNav";
import { DayDetailSheet } from "@/components/DayDetailSheet";
import { LogSheet } from "@/components/LogSheet";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TAYA",
  description: "To All You Athletes",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TAYA",
  },
  icons: {
    icon: "/icon.svg",
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
      { url: "/apple-touch-icon-167x167.png", sizes: "167x167", type: "image/png" },
      { url: "/apple-touch-icon-152x152.png", sizes: "152x152", type: "image/png" },
      { url: "/apple-touch-icon-120x120.png", sizes: "120x120", type: "image/png" },
    ],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={lexendDeca.variable}>
      <body className={`min-h-full antialiased ${lexendDeca.className}`}>
        <LogSheetProvider>
          <DayDetailSheetProvider>
            {children}
            <BottomNav />
            <DayDetailSheet />
            <LogSheet />
          </DayDetailSheetProvider>
        </LogSheetProvider>
      </body>
    </html>
  );
}
