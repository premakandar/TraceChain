import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/context/ThemeContext";
import { WalletProvider } from "@/context/WalletContext";
import { QueryProvider } from "@/context/QueryProvider";
import { ToastProvider } from "@/context/ToastContext";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "TraceChain | Blockchain supply chain provenance",
  description: "Secure, transparent, and tamper-proof provenance mapping on Stellar. Track products from manufacture to delivery.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`} suppressHydrationWarning>
        <QueryProvider>
          <ThemeProvider>
            <WalletProvider>
              <ToastProvider>
                {children}
              </ToastProvider>
            </WalletProvider>
          </ThemeProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
