'use strict';
'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet } from '@/context/WalletContext';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Wallet, Loader2, LogOut, ShieldAlert, CheckCircle } from 'lucide-react';

export function Header() {
  const { publicKey, isConnected, isConnecting, partnerProfile, connect, disconnect } = useWallet();
  const { theme, toggleTheme } = useTheme();

  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 glass-panel">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-8">
          <Link href="/" className="flex items-center gap-2">
            <span className="font-extrabold text-2xl bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 bg-clip-text text-transparent tracking-tight">
              TraceChain
            </span>
          </Link>
          <nav className="hidden md:flex items-center gap-6">
            <Link href="/" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Home
            </Link>
            {isConnected && partnerProfile && partnerProfile.status === 'APPROVED' && (
              <>
                <Link href="/dashboard" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Dashboard
                </Link>
                <Link href="/products" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Products
                </Link>
                <Link href="/shipments" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Shipments
                </Link>
                <Link href="/inventory" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                  Inventory
                </Link>
                {partnerProfile.role === 'ADMIN' && (
                  <Link href="/admin" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
                    Admin
                  </Link>
                )}
              </>
            )}
          </nav>
        </div>

        <div className="flex items-center gap-4">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-border/40"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isConnected ? (
            <div className="flex items-center gap-3">
              {partnerProfile ? (
                <div className="hidden lg:flex flex-col items-end">
                  <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                    {partnerProfile.name}
                    {partnerProfile.status === 'APPROVED' ? (
                      <CheckCircle className="h-3 w-3 text-green-500" />
                    ) : (
                      <ShieldAlert className="h-3 w-3 text-yellow-500" />
                    )}
                  </span>
                  <span className="text-[10px] text-muted-foreground uppercase tracking-wider">
                    {partnerProfile.role} - {partnerProfile.status}
                  </span>
                </div>
              ) : (
                <div className="hidden lg:flex flex-col items-end">
                  <Link href="/register" className="text-xs text-yellow-500 font-semibold hover:underline">
                    Complete Registration
                  </Link>
                </div>
              )}

              <div className="flex items-center gap-2 border border-border/40 rounded-full px-3 py-1.5 bg-secondary/30">
                <Wallet className="h-3.5 w-3.5 text-primary" />
                <span className="text-xs font-mono font-medium text-foreground">
                  {publicKey ? shortenAddress(publicKey) : ''}
                </span>
                <button
                  onClick={disconnect}
                  className="ml-1 p-1 hover:text-destructive transition-colors"
                  title="Disconnect Wallet"
                >
                  <LogOut className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-full text-sm font-semibold transition-all shadow-md hover:shadow-primary/20 hover:scale-[1.02] disabled:opacity-50"
            >
              {isConnecting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Wallet className="h-4 w-4" />
              )}
              Connect Wallet
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
