'use strict';
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { Package, ShieldAlert, Loader2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

interface InventoryItem {
  id: string;
  productId: string;
  quantity: number;
  updatedAt: string;
  product: {
    name: string;
    sku: string;
    status: string;
    manufacturer: { name: string };
  };
}

export default function InventoryPage() {
  const { publicKey, partnerProfile, isConnected } = useWallet();

  // Fetch inventory
  const { data, isLoading, error } = useQuery<{ inventory: InventoryItem[] }>({
    queryKey: ['inventory-list', publicKey],
    queryFn: async () => {
      const res = await fetch(`/api/inventory?address=${publicKey}`);
      if (!res.ok) throw new Error('Failed to load inventory');
      return res.json();
    },
    enabled: isConnected && partnerProfile?.status === 'APPROVED',
  });

  const inventory = data?.inventory || [];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-60 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              Please connect your Stellar wallet to view your inventory.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (partnerProfile?.status !== 'APPROVED') {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-yellow-500 mx-auto mb-4 animate-pulse" />
            <h3 className="text-xl font-bold mb-2">Approval Pending</h3>
            <p className="text-sm text-muted-foreground">
              Please wait for admin approval before accessing your inventory dashboard.
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

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Title */}
        <div className="mb-8 pb-6 border-b border-border/30">
          <h1 className="text-3xl font-extrabold tracking-tight">Your Inventory Custody</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review product batches currently held in your business vault node
          </p>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 border border-border/40 rounded-2xl glass-panel">
            <p>Failed to load inventory. Please verify database connection.</p>
          </div>
        ) : inventory.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl glass-panel flex flex-col items-center justify-center gap-4">
            <Package className="h-12 w-12 text-muted-foreground opacity-60 animate-pulse" />
            <h3 className="text-lg font-bold">Inventory Vault Empty</h3>
            <p className="text-xs text-muted-foreground max-w-sm mt-1 mx-auto">
              Once you receive custody of a shipment or register a product batch, it will be cached and tracked in your local inventory directory.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {inventory.map((item) => (
              <div
                key={item.id}
                className="glass-card p-6 rounded-xl border border-border/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className="text-[10px] font-bold px-2.5 py-0.5 rounded-full bg-primary/10 text-primary border border-primary/20">
                      In Stock
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      Last Updated: {new Date(item.updatedAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 tracking-tight truncate">{item.product.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mb-4">{item.product.sku}</p>

                  <div className="space-y-2 border-t border-border/40 pt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manufacturer:</span>
                      <span className="font-semibold">{item.product.manufacturer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Stellar Status:</span>
                      <span className="font-semibold">{item.product.status}</span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 mt-6 pt-4">
                  <Link
                    href={`/product/${item.productId}`}
                    className="w-full flex items-center justify-center gap-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold py-2 rounded-lg border border-border/40 transition-all text-center"
                  >
                    View Details & Trace Provenance
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
