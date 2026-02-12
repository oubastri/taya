# All TAYA code — open this file to see everything in one place

---

## app/page.tsx

```tsx
"use client";

import { Header } from "@/components/Header";

export default function Home() {
  return (
    <main className="min-h-screen overflow-x-hidden p-0 m-0">
      <Header />
    </main>
  );
}
```

---

## app/layout.tsx

```tsx
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
```

---

## app/globals.css

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --background: #FAFAF8;
  --foreground: #000000;
  --accent: #11EB0E;
}

html,
body {
  overflow-x: hidden;
}

body {
  background: var(--background);
  color: var(--foreground);
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  margin: 0;
  padding-top: 0;
}

/* Remove default heading margin so title can sit flush to top */
main h1 {
  margin: 0;
  padding: 0;
}

@supports (padding: max(0px)) {
  body {
    padding-left: max(0px, env(safe-area-inset-left));
    padding-right: max(0px, env(safe-area-inset-right));
    padding-bottom: max(0px, env(safe-area-inset-bottom));
  }
}

button:focus-visible,
input:focus-visible,
textarea:focus-visible {
  outline: 2px solid var(--foreground);
  outline-offset: 2px;
}
```

---

## components/Header.tsx

```tsx
"use client";

/**
 * Fluid edge-to-edge title. Flush to top, ~12px side breathing room, text fills width.
 */
const SIDE_PADDING_PX = 12;
const TOTAL_HORIZONTAL = SIDE_PADDING_PX * 2;

export function Header() {
  return (
    <div
      className="w-full"
      style={{
        padding: 0,
        paddingLeft: SIDE_PADDING_PX,
        paddingRight: SIDE_PADDING_PX,
      }}
    >
      {/* Desktop (768px+): ONE line, fills width, zero top space */}
      <h1
        className="hidden w-full text-left font-sans font-medium md:block"
        style={{
          margin: 0,
          padding: 0,
          fontSize: `calc((100vw - ${TOTAL_HORIZONTAL}px) / 8.9)`,
          letterSpacing: "-0.1em",
          lineHeight: 1,
          whiteSpace: "nowrap",
        }}
      >
        <span style={{ color: "#000000" }}>To All You </span>
        <span style={{ color: "#11EB0E" }}>Athletes</span>
      </h1>

      {/* Mobile (<768px): TWO lines, both scale to fit, zero top space */}
      <h1
        className="block w-full text-left font-sans font-medium md:hidden"
        style={{
          margin: 0,
          padding: 0,
          fontSize: `calc((100vw - ${TOTAL_HORIZONTAL}px) / 5.6)`,
          letterSpacing: "-0.1em",
          lineHeight: "0.693em",
        }}
      >
        <span className="block" style={{ color: "#000000" }}>
          To All You
        </span>
        <span className="block" style={{ color: "#11EB0E" }}>
          Athletes
        </span>
      </h1>
    </div>
  );
}
```

---

*To edit the real app, change the files in `app/` and `components/`, not this file. This file is just a read-only copy.*
