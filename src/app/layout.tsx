import type { Metadata } from "next";
import { Suspense } from "react";
import { Cormorant_Garamond, Outfit, Space_Grotesk } from "next/font/google";
import { WorkspaceProvider } from "@/lib/workspace";
import { ToastProvider } from "@/lib/toast";
import { CookieConsentModal } from "@/components/legal/CookieConsentModal";
import { CookiePreferencesTrigger } from "@/components/legal/CookiePreferencesTrigger";
import { ConsentAwareAnalytics } from "@/components/legal/ConsentAwareAnalytics";
import { ImpersonationProvider } from "@/lib/ImpersonationContext";
import "./globals.css";

const cormorant = Cormorant_Garamond({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-cormorant",
  preload: false,
});

const outfitFont = Outfit({
  subsets: ["latin"],
  weight: ["300", "400", "500", "600", "700"],
  display: "swap",
  variable: "--font-outfit",
  preload: false,
});

const spaceGrotesk = Space_Grotesk({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  display: "swap",
  variable: "--font-space",
  preload: false,
});

export const metadata: Metadata = {
  title: "Frosty — Merchant",
  description: "Your agents, knowledge, channels, inbox, leads, meetings, quotes and billing.",
  icons: {
    icon: [
      { url: "/icon.svg", type: "image/svg+xml" },
      { url: "/favicon.ico" },
    ],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${outfitFont.variable} ${cormorant.variable} ${spaceGrotesk.variable}`}
      suppressHydrationWarning
    >
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@24,400,0..1,0&display=block"
          rel="stylesheet"
        />
      </head>
      <body className={`${outfitFont.className} antialiased`} suppressHydrationWarning>
        <WorkspaceProvider>
          <ToastProvider>
            <Suspense fallback={null}>
              <ImpersonationProvider>
                {children}
                <ConsentAwareAnalytics />
                <CookieConsentModal />
                <CookiePreferencesTrigger />
              </ImpersonationProvider>
            </Suspense>
          </ToastProvider>
        </WorkspaceProvider>
      </body>
    </html>
  );
}
