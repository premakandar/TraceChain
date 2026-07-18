'use strict';
'use client';

import React from 'react';
import Link from 'next/link';
import { useWallet, Role } from '@/context/WalletContext';
import { useTheme } from '@/context/ThemeContext';
import { Sun, Moon, Wallet, Loader2, LogOut, ShieldAlert } from 'lucide-react';
import { usePathname } from 'next/navigation';

export function Header() {
  const { publicKey, isConnected, isConnecting, activeRole, switchRole, connect, disconnect, balance } = useWallet();
  const { theme, toggleTheme } = useTheme();
  const pathname = usePathname();

  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 6)}...${addr.substring(addr.length - 4)}`;
  };

  // Helper for active link styles
  const navLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `text-sm font-medium transition-colors pb-1 ${
      isActive
        ? 'text-primary border-b-2 border-primary'
        : 'text-muted-foreground hover:text-foreground border-b-2 border-transparent'
    }`;
  };

  // Define links per role
  const getLinksForRole = (role: string) => {
    const commonLinks = [{ label: 'Home', path: '/' }];
    const settingsLink = { label: 'Settings', path: '#' };

    switch (role) {
      case 'ADMIN':
        return [
          ...commonLinks,
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Admin Panel', path: '/admin' },
          settingsLink,
        ];
      case 'MANUFACTURER':
      case 'DISTRIBUTOR':
        return [
          ...commonLinks,
          { label: 'Dashboard', path: '/dashboard' },
          { label: 'Marketplace', path: '/marketplace' },
          { label: 'Portfolio', path: '/portfolio' },
          settingsLink,
        ];
      case 'CONSUMER':
      default:
        return [
          ...commonLinks,
          { label: 'Verify', path: '/#verify-section' },
          settingsLink,
        ];
    }
  };

  const navLinks = getLinksForRole(activeRole || 'CONSUMER');

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border/40 bg-background/80 backdrop-blur-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Left Side: Logo */}
        <div className="flex items-center gap-4 flex-shrink-0">
          <Link href="/" className="flex items-center gap-2">
            <div className="bg-primary text-primary-foreground p-1.5 rounded-md">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <span className="font-extrabold text-xl tracking-tight text-foreground">
              TraceChain
            </span>
          </Link>
        </div>

        {/* Centered Navigation */}
        <div className="hidden lg:flex flex-1 items-center justify-center">
          <nav className="flex items-center gap-6">
            {navLinks.map((link) => (
              <Link key={link.label} href={link.path} className={navLinkClass(link.path)}>
                {link.label}
              </Link>
            ))}
          </nav>
        </div>

        {/* Right Side: Actions */}
        <div className="flex items-center justify-end gap-3 flex-shrink-0">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-full hover:bg-secondary/80 text-muted-foreground hover:text-foreground transition-colors border border-border/40"
            aria-label="Toggle Theme"
          >
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </button>

          {isConnected ? (
            <div className="flex items-center gap-3">
              
              {/* Factora-style Role Switcher */}
              <div className="relative group">
                <button className="flex items-center gap-1.5 border border-border/40 rounded-full px-3 py-1.5 bg-secondary/20 hover:bg-secondary/40 transition-colors text-xs font-semibold text-foreground whitespace-nowrap">
                  <ShieldAlert className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                  Role: {activeRole}
                  <span className="text-[10px] ml-0.5 opacity-50">▼</span>
                </button>
                <div className="absolute right-0 mt-2 w-48 bg-background border border-border/40 rounded-lg shadow-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50">
                  <div className="p-2 flex flex-col gap-1">
                    {(['CONSUMER', 'INVESTOR', 'MANUFACTURER', 'DISTRIBUTOR', 'ADMIN'] as Role[]).map(r => (
                      <button 
                        key={r}
                        onClick={() => switchRole(r)}
                        className={`text-left px-3 py-2 text-xs rounded-md transition-colors ${activeRole === r ? 'bg-primary/10 text-primary font-bold' : 'hover:bg-secondary text-foreground'}`}
                      >
                        {r}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Factora-style Wallet Display */}
              <div className="flex items-center gap-2">
                <div className="hidden xl:flex flex-col items-end">
                  <span className="text-[10px] font-mono text-muted-foreground uppercase tracking-wider leading-none">
                    {publicKey ? shortenAddress(publicKey) : ''}
                  </span>
                  <span className="text-xs font-bold text-primary leading-none mt-1">
                    {balance} XLM
                  </span>
                </div>
                <button
                  onClick={disconnect}
                  className="p-2 text-muted-foreground hover:text-destructive transition-colors border border-border/40 rounded-md bg-secondary/20 hover:bg-destructive/10"
                  title="Disconnect Wallet"
                >
                  <LogOut className="h-4 w-4" />
                </button>
              </div>

            </div>
          ) : (
            <button
              onClick={connect}
              disabled={isConnecting}
              className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground px-5 py-2 rounded-lg text-sm font-semibold transition-all shadow-md hover:shadow-primary/20 hover:scale-[1.02] disabled:opacity-50 whitespace-nowrap"
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
