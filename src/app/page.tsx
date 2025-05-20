"use client"
import React, { useState, useEffect } from 'react';
import { Wallet, Zap, CheckCircle, Fuel, ArrowRight, Star, Sparkles } from "lucide-react";
import Link from 'next/link';

// Custom Solana Symbol Component
const SolanaSymbol = ({ className = "h-5 w-5", ...props }) => (
  <svg
    viewBox="0 0 397.7 311.7"
    className={className}
    fill="currentColor"
    {...props}
  >
    <path d="M64.6 237.9c2.4-2.4 5.7-3.8 9.2-3.8h317.4c5.8 0 8.7 7 4.6 11.1l-62.7 62.7c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 237.9z"/>
    <path d="M64.6 3.8C67.1 1.4 70.4 0 73.8 0h317.4c5.8 0 8.7 7 4.6 11.1L333.1 73.8c-2.4 2.4-5.7 3.8-9.2 3.8H6.5c-5.8 0-8.7-7-4.6-11.1L64.6 3.8z"/>
    <path d="M333.1 120.1c-2.4-2.4-5.7-3.8-9.2-3.8H6.5c-5.8 0-8.7 7-4.6 11.1l62.7 62.7c2.4 2.4 5.7 3.8 9.2 3.8h317.4c5.8 0 8.7-7 4.6-11.1l-62.7-62.7z"/>
  </svg>
);

export default function Home() {
  const [mounted, setMounted] = useState(false);
  const [activeFeature, setActiveFeature] = useState(0);

  useEffect(() => {
    setMounted(true);
    const interval = setInterval(() => {
      setActiveFeature((prev) => (prev + 1) % 3);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  const features = [
    { icon: Zap, title: "Instant Gas Coverage", desc: "Gas fees paid immediately after watching ads." },
    { icon: Wallet, title: "Solana Integration", desc: "Works with any Solana wallet and dApp." },
    { icon: SolanaSymbol, title: "Short Ads", desc: "Quick 15-30 second advertisements." }
  ];

  if (!mounted) return null;

  return (
    <div className="min-h-screen bg-black text-white overflow-hidden">
      {/* Animated background */}
      <div className="fixed inset-0 bg-gradient-to-br from-purple-900/20 via-black to-blue-900/20">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-purple-500/10 via-transparent to-transparent animate-pulse"></div>
      </div>
      
      {/* Navigation */}
      

      <main className="relative z-10">
        {/* Hero Section */}
        <section className="py-20 lg:py-32">
          <div className="container mx-auto px-6">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div className="space-y-8">
                <div className="space-y-6">
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm">
                    <Sparkles className="h-4 w-4" />
                    Gas-Free Transactions
                  </div>
                  <div className="space-y-4">
                    <h1 className="text-5xl lg:text-7xl font-bold leading-tight">
                      Watch Ads,{' '}
                      <span className="bg-gradient-to-r from-purple-400 via-pink-400 to-blue-400 bg-clip-text text-transparent animate-pulse">
                        Get Your Gas Fees Paid
                      </span>
                    </h1>
                    <p className="text-xl text-gray-300 leading-relaxed max-w-lg">
  Never worry about gas fees again. Watch short advertisements and we&apos;ll cover your Solana transaction costs automatically.
</p>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row gap-4">
                <Link href="/user">
  <button className="group px-8 py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold hover:from-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25 flex items-center justify-center gap-3">
    <SolanaSymbol className="h-5 w-5 group-hover:animate-pulse" />
    Send Sol
    <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
  </button>
</Link>
                
                </div>

                
              </div>

              {/* Interactive Hero Visual */}
              <div className="relative">
                <div className="relative h-96 w-96 mx-auto">
                  {/* Outer ring */}
                  <div className="absolute inset-0 rounded-full border-2 border-purple-500/30 animate-spin" style={{animationDuration: '20s'}}></div>
                  
                  {/* Middle ring */}
                  <div className="absolute inset-4 rounded-full border border-blue-500/30 animate-spin" style={{animationDuration: '15s', animationDirection: 'reverse'}}></div>
                  
                  {/* Inner circle */}
                  <div className="absolute inset-8 rounded-full bg-gradient-to-br from-purple-600/20 to-blue-600/20 backdrop-blur-xl border border-white/10 flex items-center justify-center">
                    <div className="relative">
                      <SolanaSymbol className="h-24 w-24 text-white animate-pulse" />
                      <div className="absolute inset-0 h-24 w-24 text-purple-400 animate-ping opacity-30">
                        <SolanaSymbol className="h-24 w-24" />
                      </div>
                    </div>
                  </div>

                  {/* Floating elements */}
                  <div className="absolute -top-4 -right-4 p-3 bg-gradient-to-r from-purple-600 to-pink-600 rounded-full shadow-lg shadow-purple-500/50 animate-bounce">
                    <Zap className="h-6 w-6 text-white" />
                  </div>
                  <div className="absolute -bottom-4 -left-4 p-3 bg-gradient-to-r from-blue-600 to-cyan-600 rounded-full shadow-lg shadow-blue-500/50 animate-bounce" style={{animationDelay: '1s'}}>
                    <Wallet className="h-6 w-6 text-white" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section className="py-20 bg-gradient-to-b from-black to-gray-900/50">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 bg-purple-500/10 border border-purple-500/20 rounded-full text-purple-300 text-sm mb-6">
                Features
              </div>
              <h2 className="text-5xl font-bold mb-6">
                Why Choose{' '}
                <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                Watch2Gas?
                </span>
              </h2>
              <p className="text-xl text-gray-300 max-w-3xl mx-auto">
                Transform your ad-watching time into gas fee coverage for seamless Solana transactions.
              </p>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <div 
                  key={index}
                  className={`relative p-8 rounded-2xl border transition-all duration-500 transform hover:scale-105 cursor-pointer ${
                    activeFeature === index 
                      ? 'bg-gradient-to-br from-purple-600/20 to-blue-600/20 border-purple-500/50 shadow-2xl shadow-purple-500/25' 
                      : 'bg-white/5 border-white/10 hover:border-white/20 backdrop-blur-sm'
                  }`}
                  onMouseEnter={() => setActiveFeature(index)}
                >
                  <div className="flex items-center gap-4 mb-4">
                    <div className={`p-3 rounded-full transition-all duration-300 ${
                      activeFeature === index 
                        ? 'bg-gradient-to-r from-purple-600 to-blue-600 shadow-lg shadow-purple-500/50' 
                        : 'bg-white/10'
                    }`}>
                      <feature.icon className="h-8 w-8 text-white" />
                    </div>
                    <h3 className="text-xl font-semibold">{feature.title}</h3>
                  </div>
                  <p className="text-gray-300">{feature.desc}</p>
                  
                  {activeFeature === index && (
                    <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-purple-600/10 to-blue-600/10 animate-pulse"></div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-20">
          <div className="container mx-auto px-6">
            <div className="text-center mb-16">
              <div className="inline-block px-4 py-2 bg-blue-500/10 border border-blue-500/20 rounded-full text-blue-300 text-sm mb-6">
                How It Works
              </div>
              <h2 className="text-5xl font-bold mb-6">
                Gas-Free Transactions in{' '}
                <span className="bg-gradient-to-r from-blue-400 to-cyan-400 bg-clip-text text-transparent">
                  3 Steps
                </span>
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              {[
                { num: "1", title: "Connect Wallet", desc: "Link your Solana wallet to start using Watch2Gas." },
                { num: "2", title: "Watch Ads", desc: "View short advertisements to earn gas fee credits." },
                { num: "3", title: "Free Transactions", desc: "Make transactions without worrying about gas costs." }
              ].map((step, index) => (
                <div key={index} className="relative text-center group">
                  <div className="mb-6">
                    <div className="w-20 h-20 mx-auto rounded-full bg-gradient-to-r from-purple-600 to-blue-600 flex items-center justify-center text-2xl font-bold text-white shadow-2xl shadow-purple-500/25 group-hover:scale-110 transition-transform duration-300">
                      {step.num}
                    </div>
                  </div>
                  <h3 className="text-2xl font-semibold mb-4">{step.title}</h3>
                  <p className="text-gray-300 leading-relaxed">{step.desc}</p>
                  
                  {index < 2 && (
                    <div className="hidden md:block absolute top-10 left-full w-full">
                      <ArrowRight className="h-6 w-6 text-purple-400 mx-auto animate-pulse" />
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-20  bg-gradient-to-b from-black to-gray-900/50">
          <div className="container mx-auto px-6">
            <div className="max-w-2xl mx-auto text-center">
              <div className="p-8 rounded-3xl bg-gradient-to-br from-white/10 to-white/5 backdrop-blur-xl border border-white/20 shadow-2xl">
                <div className="mb-8">
                  <div className="flex justify-center gap-1 mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className="h-6 w-6 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <h3 className="text-4xl font-bold mb-4">
                    <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
                      100% Gas Coverage
                    </span>
                  </h3>
                  <p className="text-gray-300 mb-8">
                    Complete gas fee coverage for your Solana transactions.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-8">
                  {[
                    "No upfront costs",
                    "Unlimited transactions", 
                    "Works with all dApps",
                    "Quick 30-second ads"
                  ].map((benefit, index) => (
                    <div key={index} className="flex items-center gap-2 text-left">
                      <CheckCircle className="h-5 w-5 text-green-400 flex-shrink-0" />
                      <span className="text-sm text-gray-300">{benefit}</span>
                    </div>
                  ))}
                </div>
                <Link href="/user">
                <button className="w-full py-4 bg-gradient-to-r from-purple-600 to-blue-600 rounded-xl text-white font-semibold hover:from-purple-500 hover:to-blue-500 transition-all duration-300 transform hover:scale-105 shadow-2xl shadow-purple-500/25 flex items-center justify-center gap-3">
                  <SolanaSymbol className="h-5 w-5" />
                  SEND SOL
                  <ArrowRight className="h-4 w-4" />
                
                </button>
                </Link>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-white/10 py-8 bg-black/50 backdrop-blur-xl">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <Fuel className="h-6 w-6 text-purple-400" />
              <span className="text-xl font-bold bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent">
              Watch2Gas
              </span>
            </div>
            <p className="text-gray-400 text-sm">
              © 2025 Watch2Gas. All rights reserved.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Terms</a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors text-sm">Privacy</a>
              <a href="/admin" className="text-gray-400 hover:text-white transition-colors text-sm">Admin</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}