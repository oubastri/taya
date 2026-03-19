import type { Metadata, Viewport } from "next";
import { Lexend_Deca } from "next/font/google";
import "./globals.css";
import { DayDetailSheetProvider } from "@/contexts/day-detail-sheet";
import { LogSheetProvider } from "@/contexts/log-sheet";
import { ToastProvider } from "@/contexts/toast";
import { BottomNav } from "@/components/BottomNav";
import { DayDetailSheet } from "@/components/DayDetailSheet";
import { LogSheet } from "@/components/LogSheet";
import { DevPanel } from "@/components/DevPanel";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "TAYA",
  description: "To All You Athletes",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "TAYA",
  },
  icons: {
    icon: "/icon.svg",
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
    <html lang="en" className={lexendDeca.variable} suppressHydrationWarning>
      {/* Apply saved theme before first paint to avoid flash */}
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){try{var t=localStorage.getItem('taya-theme')||( window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light');document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
        }}
      />
      <body className={`min-h-full antialiased ${lexendDeca.className}`}>
        <ToastProvider>
          <LogSheetProvider>
            <DayDetailSheetProvider>
              {children}
              <BottomNav />
              <DayDetailSheet />
              <LogSheet />
              <DevPanel />
            </DayDetailSheetProvider>
          </LogSheetProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
