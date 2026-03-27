import type { Metadata, Viewport } from "next";
import { Lexend_Deca, B612_Mono } from "next/font/google";
import "./globals.css";
import { LogSheetProvider } from "@/contexts/log-sheet";
import { ToastProvider } from "@/contexts/toast";
import { BottomNav } from "@/components/BottomNav";
import { LogSheet } from "@/components/LogSheet";
import { DevPanel } from "@/components/DevPanel";
import { Observability } from "@/components/Observability";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
  weight: ["400", "500", "600", "700"],
});

const b612Mono = B612_Mono({
  weight: "400",
  subsets: ["latin"],
  display: "swap",
  variable: "--font-mono",
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

const devThemeChrome =
  process.env.NODE_ENV === "development" ||
  process.env.NEXT_PUBLIC_DEV_MENU === "1";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className={`${lexendDeca.variable} ${b612Mono.variable}`} suppressHydrationWarning>
      <head>
        {/* Theme before paint: dev override → saved user choice (`taya-theme`) → system */}
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var dev=${devThemeChrome ? "true" : "false"};var d=localStorage.getItem('taya-theme-dev');var u=localStorage.getItem('taya-theme');var t;if(dev&&(d==='light'||d==='dark'))t=d;else if(u==='light'||u==='dark')t=u;else t=window.matchMedia('(prefers-color-scheme: dark)').matches?'dark':'light';document.documentElement.setAttribute('data-theme',t);}catch(e){}})();`,
          }}
        />
      </head>
      <body className={`min-h-full antialiased ${lexendDeca.className}`}>
        <ToastProvider>
          <LogSheetProvider>
            {children}
            <BottomNav />
            <LogSheet />
            <DevPanel />
            <Observability />
          </LogSheetProvider>
        </ToastProvider>
      </body>
    </html>
  );
}
