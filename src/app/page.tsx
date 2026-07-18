'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { ShieldCheck, ArrowRight, Search, Box, Database, Sparkles, Globe, Lock, Cpu } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { isConnected, connect } = useWallet();
  const [searchId, setSearchId] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/product/${searchId.trim()}`);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      
      {/* Background Gradients & Grid */}
      <div className="absolute inset-0 factora-grid pointer-events-none opacity-40"></div>
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[600px] bg-primary/10 rounded-full blur-[150px] pointer-events-none"></div>
      <div className="absolute bottom-0 right-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[120px] pointer-events-none"></div>

      <Header />

      <main className="flex-1 w-full flex flex-col relative z-10">
        
        {/* HERO SECTION */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24 pb-20 lg:pt-32 lg:pb-28 flex flex-col items-center text-center">
          
          <div className="inline-flex items-center justify-center gap-2 px-4 py-1.5 rounded-full border border-primary/20 bg-primary/5 text-xs font-bold tracking-widest text-primary mb-8 uppercase animate-in fade-in slide-in-from-bottom-4 duration-700">
            <Sparkles className="h-3.5 w-3.5" /> Next-Gen Enterprise Provenance
          </div>
          
          <h1 className="text-5xl md:text-6xl lg:text-8xl font-extrabold tracking-tight text-foreground leading-[1.05] max-w-5xl mx-auto mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700 delay-100">
            The Trust Layer for <br className="hidden md:block"/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-blue-500">Global Supply Chains</span>
          </h1>
          
          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10 animate-in fade-in slide-in-from-bottom-8 duration-700 delay-200">
            Secure, verifiable, and immutable product histories. TraceChain leverages Soroban smart contracts to bridge the gap between manufacturers, distributors, and consumers.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 w-full max-w-md mx-auto sm:max-w-none animate-in fade-in slide-in-from-bottom-10 duration-700 delay-300">
            <Link
              href={isConnected ? "/dashboard" : "/#verify-section"}
              className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold px-8 py-4 rounded-xl text-base transition-all shadow-[0_0_40px_-10px_rgba(59,130,246,0.5)] hover:shadow-[0_0_60px_-15px_rgba(59,130,246,0.7)] hover:scale-[1.02]"
            >
              Start Tracing Now <ArrowRight className="h-4 w-4" />
            </Link>
            
            <Link
              href="/marketplace"
              className="flex items-center justify-center gap-2 bg-background hover:bg-secondary text-foreground font-semibold px-8 py-4 rounded-xl text-base border border-border/60 transition-all shadow-sm hover:scale-[1.02]"
            >
              Browse Marketplace
            </Link>
          </div>
        </section>

        {/* SEARCH BAR SECTION */}
        <section id="verify-section" className="w-full max-w-4xl mx-auto px-4 sm:px-6 mb-32 relative z-20">
          <div className="glass-card p-2 rounded-2xl border border-border/40 shadow-2xl backdrop-blur-xl bg-background/60">
            <form onSubmit={handleSearch} className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 relative">
              <div className="hidden sm:block absolute left-6 text-muted-foreground pointer-events-none">
                <Search className="h-6 w-6" />
              </div>
              <input
                type="text"
                placeholder="Paste Product ID, SKU, or Batch Hash to verify authenticity..."
                value={searchId}
                onChange={(e) => setSearchId(e.target.value)}
                className="w-full bg-transparent border-none sm:pl-16 px-4 py-4 sm:py-6 text-base sm:text-lg font-medium focus:outline-none focus:ring-0 placeholder:text-muted-foreground/60"
              />
              <button
                type="submit"
                className="bg-foreground text-background hover:bg-foreground/90 font-bold px-8 py-4 rounded-xl transition-all shadow-md m-2 whitespace-nowrap"
              >
                Verify Provenance
              </button>
            </form>
          </div>
          
          <div className="mt-4 text-center text-xs text-muted-foreground flex items-center justify-center gap-4 opacity-70">
            <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> Immutably logged on Stellar</span>
            <span className="hidden sm:inline">•</span>
            <span className="hidden sm:flex items-center gap-1"><Globe className="h-3 w-3" /> Globally verifiable 24/7</span>
          </div>
        </section>

        {/* METRICS OR TRUST SECTION */}
        <section className="w-full border-y border-border/30 bg-secondary/10 py-12 mb-32">
          <div className="max-w-7xl mx-auto px-4 flex flex-col md:flex-row justify-around gap-8 text-center divide-y md:divide-y-0 md:divide-x divide-border/30">
            <div className="flex flex-col items-center pt-4 md:pt-0">
              <div className="text-4xl font-extrabold text-foreground mb-1">~5s</div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Transaction Finality</div>
            </div>
            <div className="flex flex-col items-center pt-4 md:pt-0">
              <div className="text-4xl font-extrabold text-foreground mb-1">100%</div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Cryptographic Truth</div>
            </div>
            <div className="flex flex-col items-center pt-4 md:pt-0">
              <div className="text-4xl font-extrabold text-foreground mb-1">Zero</div>
              <div className="text-sm font-semibold text-muted-foreground uppercase tracking-widest">Single Point of Failure</div>
            </div>
          </div>
        </section>

        {/* HOW IT WORKS / FEATURES */}
        <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 mb-32">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-4">Enterprise-Grade Traceability</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Our infrastructure combines the speed of Web2 with the trustless verifiability of Web3, powering the next generation of supply chain logistics.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Feature 1 */}
            <div className="glass-card p-8 rounded-2xl border border-border/40 hover:border-primary/50 transition-colors group">
              <div className="bg-primary/10 text-primary w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Box className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Tokenized Inventory</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Physical products are mirrored as unique digital twins on the Soroban smart contract platform, ensuring their existence and origin are mathematically provable.
              </p>
            </div>

            {/* Feature 2 */}
            <div className="glass-card p-8 rounded-2xl border border-border/40 hover:border-primary/50 transition-colors group">
              <div className="bg-primary/10 text-primary w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Cpu className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Smart Contract Logic</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Custody transfers, shipment updates, and lifecycle changes are strictly governed by trustless logic, eliminating human tampering and fraud.
              </p>
            </div>

            {/* Feature 3 */}
            <div className="glass-card p-8 rounded-2xl border border-border/40 hover:border-primary/50 transition-colors group">
              <div className="bg-primary/10 text-primary w-14 h-14 rounded-xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                <Database className="h-7 w-7" />
              </div>
              <h3 className="text-xl font-bold mb-3">Real-time Analytics</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Manufacturers and Distributors get access to a powerful SaaS dashboard with deep insights into delivery timelines, delays, and global distribution.
              </p>
            </div>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/30 bg-secondary/20 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <Link href="/" className="flex items-center gap-2 mb-4">
              <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
                <ShieldCheck className="h-5 w-5" />
              </div>
              <span className="font-extrabold text-xl tracking-tight text-foreground">TraceChain</span>
            </Link>
            <p className="text-sm text-muted-foreground max-w-sm mb-6">
              The leading Web3 platform for trustless supply chain provenance and verification.
            </p>
            <div className="text-xs text-muted-foreground">
              © {new Date().getFullYear()} TraceChain Platform. All rights reserved.
            </div>
          </div>
          
          <div>
            <h4 className="font-bold mb-4 text-foreground">Platform</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/dashboard" className="hover:text-foreground transition-colors">Dashboard</Link></li>
              <li><Link href="/marketplace" className="hover:text-foreground transition-colors">Marketplace</Link></li>
              <li><Link href="/portfolio" className="hover:text-foreground transition-colors">Portfolio</Link></li>
              <li><Link href="/admin" className="hover:text-foreground transition-colors">Admin Console</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold mb-4 text-foreground">Resources</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><a href="#" className="hover:text-foreground transition-colors">Documentation</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Smart Contracts</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">API Reference</a></li>
              <li><a href="#" className="hover:text-foreground transition-colors">Github</a></li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
