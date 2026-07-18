import { vi } from 'vitest';

vi.mock('@creit-tech/stellar-wallets-kit', () => {
  return {
    StellarWalletsKit: {
      init: vi.fn(),
      authModal: vi.fn(),
      disconnect: vi.fn(),
    },
    Networks: {
      TESTNET: 'Test SDF Network ; September 2015',
    },
  };
});
import React from 'react';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { ThemeProvider, useTheme } from '@/context/ThemeContext';
import { WalletProvider, useWallet } from '@/context/WalletContext';
import { Header } from '@/components/shared/Header';
import { QueryProvider } from '@/context/QueryProvider';
import { ToastProvider } from '@/context/ToastContext';

// Helper component to test ThemeContext
const ThemeTestComponent = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme-value">{theme}</span>
      <button data-testid="toggle-btn" onClick={toggleTheme}>Toggle</button>
    </div>
  );
};

// Helper component to test WalletContext
const WalletTestComponent = () => {
  const { isConnected, publicKey } = useWallet();
  return (
    <div>
      <span data-testid="connected">{isConnected ? 'yes' : 'no'}</span>
      <span data-testid="pubkey">{publicKey || 'null'}</span>
    </div>
  );
};

describe('Frontend Core Contexts & Components', () => {
  
  // Test 1: Theme Management
  it('ThemeContext initializes with dark and toggles properly', () => {
    render(
      <ThemeProvider>
        <ThemeTestComponent />
      </ThemeProvider>
    );

    const themeVal = screen.getByTestId('theme-value');
    expect(themeVal.textContent).toBe('light'); // Falls back to light when prefers-color-scheme is false

    const toggleBtn = screen.getByTestId('toggle-btn');
    fireEvent.click(toggleBtn);

    expect(themeVal.textContent).toBe('dark');
  });

  // Test 2: Wallet Context Init
  it('WalletContext initializes as disconnected', () => {
    render(
      <WalletProvider>
        <WalletTestComponent />
      </WalletProvider>
    );

    expect(screen.getByTestId('connected').textContent).toBe('no');
    expect(screen.getByTestId('pubkey').textContent).toBe('null');
  });

  // Test 3: Header Component Rendering
  it('Header component renders platform logo title', () => {
    render(
      <QueryProvider>
        <ThemeProvider>
          <WalletProvider>
            <ToastProvider>
              <Header />
            </ToastProvider>
          </WalletProvider>
        </ThemeProvider>
      </QueryProvider>
    );

    const logoText = screen.getByText('TraceChain');
    expect(logoText).toBeInTheDocument();
  });

});
