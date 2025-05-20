"use client";
import { useEffect, useState } from "react";
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui";
import { Fuel } from "lucide-react";
import Link from "next/link";
import React from "react";

export default function Navbar() {
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  return (
   
      <nav className="sticky top-0 z-50 border-b border-white/10 backdrop-blur-xl bg-black/50">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <Link href="/">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Fuel className="h-8 w-8 text-purple-400" />
                <div className="absolute inset-0 h-8 w-8 text-purple-400 animate-ping opacity-30">
                  <Fuel className="h-8 w-8" />
                </div>
              </div>
              <span className="text-2xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Watch2Gas
              </span>
            </div>
            </Link>
           
            {isMounted ? (
            <WalletMultiButton />
          ) : (
            <div className="wallet-adapter-button-trigger">
              <button className="wallet-adapter-button wallet-adapter-button-trigger">
                Select Wallet
              </button>
            </div>
          )}
           
          </div>
        </div>
      </nav>
 
  );
}