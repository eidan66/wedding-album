import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import Layout from "@/components/Layout";
import { ToastProvider } from "@/components/ui/toast";
import { ThemeProvider } from "@/contexts/ThemeContext";
import { SentryProvider } from "@/components/SentryProvider";
import QueryProvider from "@/providers/QueryProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sapir & Idan Wedding Album",
  description: "Sapir & Idan Wedding Digital Album",
  icons: {
    icon: '/wedding-rings.svg',
    shortcut: '/wedding-rings.svg',
  },
};

export default function RootLayout({ children, }: Readonly<{ children: React.ReactNode; }>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <SentryProvider>
          <QueryProvider>
            <ThemeProvider>
              <ToastProvider>
                <Layout>
                  {children}
                </Layout>
              </ToastProvider>
            </ThemeProvider>
          </QueryProvider>
        </SentryProvider>
        <Analytics />
      </body>
    </html>
  );
}
