'use strict';
'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { StellarService } from '@/services/stellar';
import { Package, ArrowRightLeft, ShieldAlert, Loader2, Send } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  status: string;
}

export default function OwnershipPage() {
  const { publicKey, partnerProfile, isConnected } = useWallet();
  const { showTxToast, showToast } = useToast();
  const queryClient = useQueryClient();
  const router = useRouter();

  // Selected product state
  const [selectedProductId, setSelectedProductId] = useState('');
  const [recipientAddress, setRecipientAddress] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Fetch products owned by this partner
  const { data, isLoading } = useQuery<{ products: Product[] }>({
    queryKey: ['owned-products', publicKey],
    queryFn: async () => {
      if (!publicKey) return { products: [] };
      const res = await fetch(`/api/products?owner=${publicKey}`);
      if (!res.ok) throw new Error('Failed to load owned products');
      return res.json();
    },
    enabled: !!publicKey,
  });

  const ownedProducts = data?.products || [];

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !selectedProductId || !recipientAddress) {
      showToast('Validation Error', 'Please select a product and enter a valid recipient address.', 'warning');
      return;
    }

    if (recipientAddress === publicKey) {
      showToast('Validation Error', 'Cannot transfer ownership to yourself.', 'warning');
      return;
    }

    setSubmitting(true);
    const selectedProd = ownedProducts.find((p) => p.id === selectedProductId);
    const txToast = showTxToast(`Transferring ownership of ${selectedProd?.name || 'Product'}`);

    try {
      await StellarService.transferOwnership(
        selectedProductId,
        publicKey,
        recipientAddress,
        {
          onStepChange: (step) => {
            txToast.updateStep(step);
          },
        }
      );

      showToast('Transfer Successful', 'Product ownership has been securely transferred on Stellar.', 'success');
      setSelectedProductId('');
      setRecipientAddress('');
      queryClient.invalidateQueries({ queryKey: ['owned-products', publicKey] });
    } catch (err: any) {
      console.error(err);
      showToast('Transfer Failed', err.message || 'Ownership transfer rejected.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isAuthorizedRole =
    partnerProfile?.role === 'MANUFACTURER' ||
    partnerProfile?.role === 'DISTRIBUTOR' ||
    partnerProfile?.role === 'RETAILER';

  const isApproved = partnerProfile?.status === 'APPROVED';

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-60 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Wallet Connection Required</h3>
            <p className="text-sm text-muted-foreground">
              Please connect your Stellar wallet to view and manage product ownership.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!isAuthorizedRole || !isApproved) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              Only approved Manufacturers, Distributors, or Retailers are authorized to transfer product ownership.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-6xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        <div className="mb-8 pb-6 border-b border-border/30">
          <h1 className="text-3xl font-extrabold tracking-tight">Ownership Transfers</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Securely transfer product custody and record ownership logs on the Stellar Network
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Inventory Listing / Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="glass-card p-6 rounded-xl border border-border/40">
              <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Package className="h-5 w-5 text-primary" />
                Select Product from Your Custody
              </h3>

              {isLoading ? (
                <div className="flex justify-center py-12">
                  <Loader2 className="h-8 w-8 text-primary animate-spin" />
                </div>
              ) : ownedProducts.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground border border-dashed border-border/40 rounded-lg">
                  <p className="text-sm">You do not hold any product custody in your inventory.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {ownedProducts.map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProductId(product.id)}
                      className={`p-4 rounded-xl text-left border transition-all ${
                        selectedProductId === product.id
                          ? 'border-primary bg-primary/5 shadow-md shadow-primary/5'
                          : 'border-border/45 hover:border-border/80'
                      }`}
                    >
                      <h4 className="font-bold text-sm truncate">{product.name}</h4>
                      <p className="text-[10px] text-muted-foreground font-mono mt-1">{product.sku}</p>
                      <p className="text-[10px] text-primary/80 font-mono mt-2 truncate" title={product.id}>
                        ID: {product.id}
                      </p>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Transfer Execution Form / Right Column */}
          <div className="glass-card p-6 rounded-xl border border-border/40 h-fit space-y-6">
            <h3 className="text-lg font-bold flex items-center gap-2">
              <ArrowRightLeft className="h-5 w-5 text-indigo-500" />
              Transfer Custody
            </h3>

            <form onSubmit={handleTransfer} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Selected Product ID
                </label>
                <input
                  type="text"
                  readOnly
                  placeholder="Select a product from inventory"
                  value={selectedProductId}
                  className="w-full bg-secondary/10 border border-border/40 rounded-lg px-4 py-2.5 text-xs font-mono text-muted-foreground focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Recipient Public Address
                </label>
                <input
                  type="text"
                  placeholder="Enter recipient Stellar wallet key"
                  value={recipientAddress}
                  onChange={(e) => setRecipientAddress(e.target.value)}
                  required
                  className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 font-mono"
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !selectedProductId || !recipientAddress}
                className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 rounded-lg text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitting ? 'Signing Transfer...' : (
                  <>
                    <Send className="h-4 w-4" />
                    Submit Transfer
                  </>
                )}
              </button>
            </form>
          </div>

        </div>
      </main>
    </div>
  );
}
