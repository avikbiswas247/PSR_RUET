import type { Metadata } from "next";
import type { ReactNode } from "react";
import localFont from "next/font/local";
import "./globals.css";
import { ThemeProvider } from "@/components/providers/theme-provider";
import { AuthProvider } from "@/components/providers/auth-provider";
import { SiteHeader } from "@/components/layout/site-header";
import { SiteFooter } from "@/components/layout/site-footer";
import { SkipToContent } from "@/components/layout/skip-to-content";

const geistSans = localFont({
  src: "../public/fonts/geist-latin.woff2",
  variable: "--font-geist-sans",
  weight: "400 600",
  display: "swap",
});
const geistMono = localFont({
  src: "../public/fonts/geist-mono-latin.woff2",
  variable: "--font-geist-mono",
  weight: "400 600",
  display: "swap",
});

export const metadata: Metadata = {
  title: "PSR — See Beyond the Obvious",
  description: "A community of curious eyes and creative minds. Discover photography, portfolios, events and membership at PSR.",
  applicationName: "PSR",
};

export const viewport = {
  themeColor: "#090909",
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} antialiased`} data-scroll-behavior="smooth">
      <body>
        <ThemeProvider>
          <AuthProvider>
            <SkipToContent />
          <SiteHeader />
            {children}
            <SiteFooter />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
