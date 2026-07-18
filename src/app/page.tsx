'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { ShieldCheck, ArrowRight, Search, Activity, Package, Landmark, ArrowRightLeft } from 'lucide-react';
import Link from 'next/link';

export default function Home() {
  const { isConnected, partnerProfile, connect } = useWallet();
  const [searchId, setSearchId] = useState('');
  const router = useRouter();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchId.trim()) {
      router.push(`/product/${searchId.trim()}`);
    }
  };

  const getLaunchPath = () => {
    if (!isConnected) return '#';
    if (!partnerProfile) return '/register';
    return '/dashboard';
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Stars/Dots background glow */}
      <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-primary/10 rounded-full blur-[150px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] bg-purple-500/10 rounded-full blur-[150px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 flex flex-col justify-center items-center relative z-10">
        
        {/* Hero Section */}
        <div className="text-center max-w-3xl space-y-6 mb-16 animate-in fade-in slide-in-from-bottom duration-700">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-border/40 bg-secondary/30 text-xs font-semibold text-primary mb-4">
            <Landmark className="h-3 w-3" /> Powered by Stellar & Soroban
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight">
            Blockchain-Powered Supply Chain{' '}
            <span className="bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent">
              Provenance
            </span>
          </h1>
          
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            TraceChain enables manufacturers, distributors, carriers, and consumers to securely verify product authenticity and track status changes in real-time.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 pt-4">
            {isConnected ? (
              <Link
                href={getLaunchPath()}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 py-3 rounded-lg text-sm transition-all shadow-lg hover:shadow-primary/20 hover:scale-[1.01]"
              >
                Go to Dashboard
                <ArrowRight className="h-4 w-4" />
              </Link>
            ) : (
              <button
                onClick={connect}
                className="flex items-center justify-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-6 py-3 rounded-lg text-sm transition-all shadow-lg hover:shadow-primary/20 hover:scale-[1.01]"
              >
                Get Started Now
                <ArrowRight className="h-4 w-4" />
              </button>
            )}
            <a
              href="#verify-section"
              className="flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground font-semibold px-6 py-3 rounded-lg text-sm border border-border/40 transition-all hover:scale-[1.01]"
            >
              Verify Authenticity
            </a>
          </div>
        </div>

        {/* Verification Search Section */}
        <section id="verify-section" className="w-full max-w-2xl mx-auto mb-20">
          <div className="glass-card p-8 rounded-2xl border border-border/40 shadow-lg relative">
            <h3 className="text-xl font-bold mb-2">Public Provenance Verification</h3>
            <p className="text-xs text-muted-foreground mb-6">
              Enter any Product ID / Batch Hash below to check its ownership history, authenticity certificate, and shipment timelines.
            </p>
            <form onSubmit={handleSearch} className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Enter Product ID (e.g. prod_01j2...)"
                  value={searchId}
                  onChange={(e) => setSearchId(e.target.value)}
                  className="w-full bg-secondary/20 border border-border/40 rounded-lg pl-10 pr-4 py-3 text-sm focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
                />
              </div>
              <button
                type="submit"
                className="bg-foreground text-background hover:bg-foreground/90 font-semibold px-5 py-3 rounded-lg text-sm transition-all hover:scale-[1.01]"
              >
                Verify
              </button>
            </form>
          </div>
        </section>

        {/* Features Grid */}
        <section className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-12">
          <div className="glass-card p-6 rounded-xl border border-border/30">
            <ShieldCheck className="h-10 w-10 text-green-500 mb-4" />
            <h4 className="text-lg font-bold mb-2">Tamper-Proof Provenance</h4>
            <p className="text-sm text-muted-foreground">
              Every tracking step, batch registration, and ownership update is permanently written to Stellar's Ledger.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-border/30">
            <ArrowRightLeft className="h-10 w-10 text-indigo-500 mb-4" />
            <h4 className="text-lg font-bold mb-2">Cross-Contract Logic</h4>
            <p className="text-sm text-muted-foreground">
              Shipment and Ownership updates validate states dynamically using native Soroban inter-contract validation.
            </p>
          </div>

          <div className="glass-card p-6 rounded-xl border border-border/30">
            <Activity className="h-10 w-10 text-purple-500 mb-4" />
            <h4 className="text-lg font-bold mb-2">SaaS-Grade Analytics</h4>
            <p className="text-sm text-muted-foreground">
              Monitor active transit workflows, shipment schedules, delivery timelines, and manufacturer directories in real-time.
            </p>
          </div>
        </section>

      </main>

      <footer className="border-t border-border/40 py-8 bg-secondary/10 relative z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row justify-between items-center gap-4 text-xs text-muted-foreground">
          <p>© {new Date().getFullYear()} TraceChain Platform. All rights reserved.</p>
          <div className="flex gap-4">
            <a href="#" className="hover:underline">Terms</a>
            <a href="#" className="hover:underline">Privacy Policy</a>
            <a href="#" className="hover:underline">Docs</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
