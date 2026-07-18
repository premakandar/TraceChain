'use strict';
'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
import { StellarWalletsKit, Networks } from '@creit-tech/stellar-wallets-kit';
import { defaultModules } from '@creit-tech/stellar-wallets-kit/modules/utils';

export type Role = 'ADMIN' | 'MANUFACTURER' | 'DISTRIBUTOR' | 'LOGISTICS' | 'RETAILER' | 'CONSUMER';
export type PartnerStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface PartnerProfile {
  walletAddress: string;
  name: string;
  role: Role;
  status: PartnerStatus;
  email: string | null;
}

interface WalletContextType {
  publicKey: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  error: string | null;
  partnerProfile: PartnerProfile | null;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshProfile: (address: string) => Promise<void>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

let walletKit: any = null;

// Initialize kit once on client side
const getWalletKit = () => {
  if (typeof window === 'undefined') return null;
  if (!walletKit) {
    (StellarWalletsKit as any).init({
      network: Networks.TESTNET,
      modules: defaultModules(),
    });
    walletKit = StellarWalletsKit;
  }
  return walletKit;
};

export function WalletProvider({ children }: { children: React.ReactNode }) {
  const [publicKey, setPublicKey] = useState<string | null>(null);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [partnerProfile, setPartnerProfile] = useState<PartnerProfile | null>(null);

  // Auto-connect if wallet details are saved in localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem('wallet_address');
    if (savedAddress) {
      setPublicKey(savedAddress);
      setIsConnected(true);
      refreshProfile(savedAddress);
    }
  }, []);

  const refreshProfile = async (address: string) => {
    try {
      const response = await fetch(`/api/auth/session?address=${address}`);
      if (response.ok) {
        const data = await response.json();
        if (data.partner) {
          setPartnerProfile(data.partner);
        } else {
          setPartnerProfile(null);
        }
      } else {
        setPartnerProfile(null);
      }
    } catch (err) {
      console.error('Failed to fetch partner session:', err);
      setPartnerProfile(null);
    }
  };

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const kit = getWalletKit();
      if (!kit) throw new Error('Wallet Kit not available');

      // Use authModal which shows the UI modal to select wallet and returns address
      const { address } = await (StellarWalletsKit as any).authModal({
        authModal: {
          showInstallLabel: true,
          hideUnsupportedWallets: false,
        }
      });

      if (!address) {
        throw new Error('No address returned from wallet connection');
      }

      setPublicKey(address);
      setIsConnected(true);
      localStorage.setItem('wallet_address', address);
      await refreshProfile(address);
    } catch (err: any) {
      console.error('Wallet connection failed:', err);
      setError(err?.message || 'Failed to connect wallet');
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnect = async () => {
    try {
      await (StellarWalletsKit as any).disconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    setPublicKey(null);
    setIsConnected(false);
    setPartnerProfile(null);
    localStorage.removeItem('wallet_address');
  };

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected,
        isConnecting,
        error,
        partnerProfile,
        connect,
        disconnect,
        refreshProfile,
      }}
    >
      {children}
    </WalletContext.Provider>
  );
}

export function useWallet() {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
}
