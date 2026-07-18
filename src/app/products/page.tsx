'use strict';
'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { Package, Search, Plus, ExternalLink, Loader2, ArrowRight } from 'lucide-react';

interface Product {
  id: string;
  name: string;
  sku: string;
  status: string;
  createdAt: string;
  manufacturer: { name: string; walletAddress: string };
  currentOwner: { name: string; walletAddress: string };
}

export default function ProductsPage() {
  const { isConnected, partnerProfile } = useWallet();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // TanStack Query to fetch products
  const { data, isLoading, error } = useQuery<{ products: Product[] }>({
    queryKey: ['products', searchTerm, statusFilter],
    queryFn: async () => {
      const url = new URL('/api/products', window.location.origin);
      if (searchTerm) url.searchParams.set('search', searchTerm);
      if (statusFilter) url.searchParams.set('status', statusFilter);
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to load products');
      return res.json();
    },
  });

  const products = data?.products || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'REGISTERED':
        return 'bg-blue-500/10 text-blue-500 border border-blue-500/20';
      case 'IN_TRANSIT':
        return 'bg-yellow-500/10 text-yellow-500 border border-yellow-500/20';
      case 'DELIVERED':
        return 'bg-green-500/10 text-green-500 border border-green-500/20';
      case 'SOLD':
        return 'bg-gray-500/10 text-gray-500 border border-gray-500/20';
      default:
        return 'bg-secondary/40 text-muted-foreground border border-border/40';
    }
  };

  const isManufacturer = partnerProfile?.role === 'MANUFACTURER' && partnerProfile?.status === 'APPROVED';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Stars/Glow background */}
      <div className="absolute top-0 right-0 w-[40%] h-[40%] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Page title section */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-border/30">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Product Directory</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Browse registered product batches, trace ownership logs, and print QR authenticity tags
            </p>
          </div>
          {isManufacturer && (
            <Link
              href="/products/new"
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm transition-all shadow-md hover:scale-[1.01]"
            >
              <Plus className="h-4 w-4" />
              Register Batch
            </Link>
          )}
        </div>

        {/* Filter controls bar */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search by ID, Name, SKU..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-secondary/20 border border-border/40 rounded-lg pl-9 pr-4 py-2.5 text-sm focus:outline-none focus:border-primary/80"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-secondary/20 border border-border/40 rounded-lg px-4 py-2.5 text-sm focus:outline-none text-muted-foreground focus:border-primary/80"
          >
            <option value="">All Statuses</option>
            <option value="REGISTERED">Registered</option>
            <option value="IN_TRANSIT">In Transit</option>
            <option value="DELIVERED">Delivered</option>
            <option value="SOLD">Sold</option>
          </select>
        </div>

        {/* Products Grid */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Loading products catalog...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 border border-border/40 rounded-2xl glass-panel">
            <p>Failed to load products. Please check database connectivity.</p>
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-24 border border-dashed border-border/60 rounded-2xl glass-panel flex flex-col items-center justify-center gap-4">
            <Package className="h-12 w-12 text-muted-foreground opacity-60" />
            <div>
              <h3 className="text-lg font-bold">No Products Found</h3>
              <p className="text-xs text-muted-foreground max-w-sm mt-1 mx-auto">
                {searchTerm || statusFilter
                  ? 'No products match your active search filters. Try clearing inputs.'
                  : 'Get started by creating the first product batch using an approved Manufacturer wallet.'}
              </p>
            </div>
            {isManufacturer && (
              <Link
                href="/products/new"
                className="bg-secondary hover:bg-secondary/80 text-foreground border border-border/40 font-semibold px-4 py-2 rounded-lg text-sm transition-all"
              >
                Create Product Batch
              </Link>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map((product) => (
              <div
                key={product.id}
                className="glass-card p-6 rounded-xl border border-border/30 flex flex-col justify-between"
              >
                <div>
                  <div className="flex justify-between items-start mb-4">
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${getStatusColor(product.status)}`}>
                      {product.status}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {new Date(product.createdAt).toLocaleDateString()}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold mb-1 tracking-tight truncate">{product.name}</h3>
                  <p className="text-xs text-muted-foreground font-mono mb-4">{product.sku}</p>

                  <div className="space-y-2 border-t border-border/40 pt-4 text-xs">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Manufacturer:</span>
                      <span className="font-semibold">{product.manufacturer.name}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Current Owner:</span>
                      <span className="font-semibold text-primary truncate max-w-[150px]" title={product.currentOwner.walletAddress}>
                        {product.currentOwner.name}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="border-t border-border/40 mt-6 pt-4 flex gap-3">
                  {/* Public QR Provenance details link */}
                  <Link
                    href={`/product/${product.id}`}
                    className="flex-1 flex items-center justify-center gap-1.5 bg-secondary hover:bg-secondary/80 text-foreground text-xs font-semibold py-2 rounded-lg border border-border/40 transition-all text-center"
                  >
                    Trace History
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
