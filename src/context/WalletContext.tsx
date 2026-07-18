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
  activeRole: Role;
  balance: string;
  switchRole: (role: Role) => void;
  connect: () => Promise<void>;
  disconnect: () => Promise<void>;
  refreshProfile: (address: string) => Promise<void>;
  refreshBalance: () => Promise<void>;
  signTx: (xdr: string) => Promise<{ signedXDR: string }>;
}

const WalletContext = createContext<WalletContextType | undefined>(undefined);

let walletKit: any = null;

// Initialize kit once on client side
const getWalletKit = () => {
  if (typeof window === 'undefined') return null;
  if (!walletKit) {
    StellarWalletsKit.init({
      network: Networks.TESTNET,
      modules: defaultModules(),
      authModal: {
        showInstallLabel: true,
        hideUnsupportedWallets: false,
      }
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
  const [activeRole, setActiveRole] = useState<Role>('CONSUMER');
  const [balance, setBalance] = useState<string>('0.00');

  const refreshBalance = async () => {
    if (!publicKey) {
      setBalance('0.00');
      return;
    }
    try {
      const res = await fetch(`https://horizon-testnet.stellar.org/accounts/${publicKey}`);
      if (!res.ok) throw new Error('Account not found');
      const data = await res.json();
      const nativeBalance = data.balances.find((b: any) => b.asset_type === 'native');
      if (nativeBalance) {
        const formatted = parseFloat(nativeBalance.balance).toLocaleString('en-US', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2,
        });
        setBalance(formatted);
      }
    } catch (e) {
      console.warn('Horizon fetch failed, using fallback balance:', e);
      setBalance('0.00');
    }
  };

  // Fetch balance on key change
  useEffect(() => {
    refreshBalance();
  }, [publicKey]);

  // partnerProfile is always active for any connected wallet — roles are for UI simulation only
  const partnerProfile: PartnerProfile | null = isConnected && publicKey ? {
    walletAddress: publicKey,
    name: `${activeRole.charAt(0) + activeRole.slice(1).toLowerCase()} Node`,
    role: activeRole,
    status: 'APPROVED',
    email: null,
  } : null;

  // Auto-connect if wallet details are saved in localStorage
  useEffect(() => {
    const savedAddress = localStorage.getItem('wallet_address');
    if (savedAddress) {
      setPublicKey(savedAddress);
      setIsConnected(true);
    }
  }, []);

  const refreshProfile = async (_address: string) => {
    // No-op: profile is derived from wallet connection + selected role
  };

  const switchRole = (role: Role) => {
    setActiveRole(role);
  };

  const connect = async () => {
    setIsConnecting(true);
    setError(null);
    try {
      const kit = getWalletKit();
      if (!kit) throw new Error('Wallet Kit not available');

      // Use authModal which shows the UI modal to select wallet and returns address
      const { address } = await StellarWalletsKit.authModal();

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
      await StellarWalletsKit.disconnect();
    } catch (err) {
      console.error('Disconnect error:', err);
    }
    setPublicKey(null);
    setIsConnected(false);
    localStorage.removeItem('wallet_address');
  };

  const signTx = async (xdr: string) => {
    const kit = getWalletKit();
    if (!kit) throw new Error('Wallet Kit not available');
    
    // signTransaction requests signature from the wallet
    // Correct call: first parameter is xdr (string), second parameter is opts object.
    const response = await StellarWalletsKit.signTransaction(xdr, {
      networkPassphrase: Networks.TESTNET,
    });
    
    return { signedXDR: response.signedTxXdr };
  };

  return (
    <WalletContext.Provider
      value={{
        publicKey,
        isConnected,
        isConnecting,
        error,
        partnerProfile,
        activeRole,
        balance,
        switchRole,
        connect,
        disconnect,
        refreshProfile,
        refreshBalance,
        signTx,
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
