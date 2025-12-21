import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from '@clerk/nextjs'; // Import this
import Navbar from './components/Navbar';
import Footer from './components/Footer';
// import "keen-slider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Eyoris Fashion",
  description: "AI-Powered Fashion Store",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    // Wrap with ClerkProvider
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning={true}>
        <body className={`${inter.className} flex flex-col min-h-screen`}>
          {children}
          <Footer />
        </body>
      </html>
    </ClerkProvider>
  );
}