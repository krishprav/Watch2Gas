"use client";

import {  Geist_Mono } from "next/font/google";
import "./globals.css";

import { ConnectionProvider, WalletProvider } from "@solana/wallet-adapter-react";
import { WalletModalProvider } from "@solana/wallet-adapter-react-ui";



import"@solana/wallet-adapter-react-ui/styles.css"
import { ThemeProvider } from "../app/component/theme-provider";
import Navbar from "../app/component/navbar";



const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
    
      <body className={` ${geistMono.variable} antialiased`}  >
        <ThemeProvider attribute="class" defaultTheme="dark" enableSystem disableTransitionOnChange>
          <ConnectionProvider endpoint={"https://api.devnet.solana.com"}>
            <WalletProvider wallets={[]} autoConnect>
              <WalletModalProvider>
                <Navbar />
              
                {children}
           
              </WalletModalProvider>
            </WalletProvider>
          </ConnectionProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}