'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { StellarService } from '@/services/stellar';
import { Package, ShieldAlert, Award, Hash, FileText, ExternalLink } from 'lucide-react';

export default function NewProductPage() {
  const { publicKey, isConnected, signTx } = useWallet();
  const { showTxToast, showToast } = useToast();
  const router = useRouter();

  const [productId] = useState(() => 'prod_' + Math.random().toString(36).substring(2, 10));
  const [name, setName] = useState('');
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [lastTxHash, setLastTxHash] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !name || !sku) {
      showToast('Validation Error', 'Please fill in all required fields.', 'warning');
      return;
    }

    setSubmitting(true);
    const txToast = showTxToast(`Registering Product: ${name}`);

    try {
      const txHash = await StellarService.registerProduct(
        productId,
        name,
        sku,
        publicKey,
        { onStepChange: (step) => txToast.updateStep(step) },
        publicKey,
        signTx
      );

      setLastTxHash(txHash);
      showToast('Product Minted On-Chain', `Tx: ${txHash.substring(0, 16)}…`, 'success');
      setTimeout(() => router.push('/marketplace'), 2000);
    } catch (err: any) {
      console.error(err);
      showToast('Transaction Failed', err.message || 'Product registration failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-60 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Wallet Required</h3>
            <p className="text-sm text-muted-foreground">
              Connect your Freighter wallet to register products on the Stellar Testnet.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[130px] pointer-events-none" />
      <Header />

      <main className="flex-1 max-w-2xl mx-auto w-full px-4 py-12 relative z-10">
        <div className="glass-card p-8 rounded-2xl border border-border/40 shadow-xl">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-border/40">
            <Package className="h-6 w-6 text-primary" />
            <div>
              <h2 className="text-2xl font-bold tracking-tight">Register New Product Batch</h2>
              <p className="text-xs text-muted-foreground">Mints a product NFT on the Stellar Testnet via Soroban</p>
            </div>
          </div>

          {/* Network info banner */}
          <div className="mb-6 p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-green-400 animate-pulse" />
            <span className="text-xs text-muted-foreground font-mono">
              Signer: <span className="text-primary">{publicKey?.substring(0, 12)}…{publicKey?.substring(48)}</span>
            </span>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <Hash className="h-3.5 w-3.5" /> Product Hash ID (Auto-Generated)
              </label>
              <input
                type="text"
                value={productId}
                readOnly
                className="w-full bg-secondary/10 border border-border/40 rounded-lg px-4 py-2.5 text-sm font-mono text-muted-foreground cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Award className="h-3.5 w-3.5" /> Product Name
                </label>
                <input
                  type="text"
                  placeholder="e.g. Arabica Blend Beans"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                  <Hash className="h-3.5 w-3.5" /> Batch SKU
                </label>
                <input
                  type="text"
                  placeholder="e.g. COF-ARA-092"
                  value={sku}
                  onChange={(e) => setSku(e.target.value)}
                  required
                  className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                <FileText className="h-3.5 w-3.5" /> Description & Notes
              </label>
              <textarea
                rows={3}
                placeholder="Details about origin, lot number, quality notes, etc."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80 resize-none"
              />
            </div>

            {lastTxHash && (
              <a
                href={`https://stellar.expert/explorer/testnet/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-primary hover:underline"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                View on Stellar Expert: {lastTxHash.substring(0, 20)}…
              </a>
            )}

            <div className="flex gap-4 pt-2">
              <button
                type="button"
                onClick={() => router.back()}
                className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground font-semibold py-2.5 rounded-lg text-sm border border-border/40 transition-all"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 rounded-lg text-sm transition-all shadow-md hover:shadow-primary/10 disabled:opacity-50"
              >
                {submitting ? 'Signing & Broadcasting…' : 'Register Product On-Chain'}
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
