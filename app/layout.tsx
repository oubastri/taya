import type { Metadata, Viewport } from "next";
import { Lexend_Deca } from "next/font/google";
import "./globals.css";

const lexendDeca = Lexend_Deca({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "To All You Athletes",
  description: "Workout tracker for athletes",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "To All You Athletes",
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
        {children}
      </body>
    </html>
  );
}
