'use strict';
'use client';

import React, { use } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useTheme } from '@/context/ThemeContext';
import { QRCodeSVG } from 'qrcode.react';
import { ShieldCheck, Package, MapPin, Calendar, User, ArrowDownRight, Loader2, ArrowRight } from 'lucide-react';

interface Params {
  id: string;
}

interface ProductDetails {
  id: string;
  name: string;
  sku: string;
  description: string | null;
  status: string;
  createdAt: string;
  txHash: string;
  manufacturer: { name: string; walletAddress: string; email: string | null };
  currentOwner: { name: string; walletAddress: string; email: string | null };
  ownershipHistory: Array<{
    id: string;
    fromAddress: string;
    toAddress: string;
    timestamp: string;
    txHash: string;
  }>;
  shipments: Array<{
    id: string;
    source: string;
    destination: string;
    status: string;
    carrier: { name: string };
    updates: Array<{
      status: string;
      location: string;
      description: string | null;
      timestamp: string;
    }>;
  }>;
}

export default function ProductDetailPage({ params }: { params: Promise<Params> }) {
  const { id } = use(params);
  const { theme } = useTheme();

  // Fetch product detailed tracking history
  const { data, isLoading, error } = useQuery<{ product: ProductDetails }>({
    queryKey: ['product-detail', id],
    queryFn: async () => {
      const res = await fetch(`/api/products/${id}`);
      if (!res.ok) throw new Error('Product not found');
      return res.json();
    },
  });

  const product = data?.product;

  const shortenAddress = (addr: string) => {
    return `${addr.substring(0, 8)}...${addr.substring(addr.length - 6)}`;
  };

  const getQRValue = () => {
    if (typeof window !== 'undefined') {
      return `${window.location.origin}/product/${id}`;
    }
    return `https://tracechain.platform/product/${id}`;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center gap-3">
          <Loader2 className="h-10 w-10 text-primary animate-spin" />
          <p className="text-sm text-muted-foreground">Retrieving product provenance timeline...</p>
        </main>
      </div>
    );
  }

  if (error || !product) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <h3 className="text-xl font-bold text-red-500 mb-2">Product Not Found</h3>
            <p className="text-sm text-muted-foreground mb-6">
              The requested Product ID/Batch Hash does not match any registered records on Stellar.
            </p>
            <Link href="/" className="bg-primary text-primary-foreground font-semibold px-4 py-2 rounded-lg text-sm transition-all">
              Go Home
            </Link>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/4 left-1/4 w-[500px] h-[500px] bg-primary/5 rounded-full blur-[140px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-5xl mx-auto w-full px-4 py-12 relative z-10 space-y-8">
        
        {/* Verification Certificate Header */}
        <div className="glass-panel p-6 rounded-2xl border border-green-500/25 bg-green-500/5 flex flex-col md:flex-row items-center justify-between gap-6 shadow-md">
          <div className="flex items-center gap-4 text-center md:text-left">
            <div className="p-3 bg-green-500/10 rounded-full border border-green-500/30">
              <ShieldCheck className="h-8 w-8 text-green-500" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-green-500 flex items-center gap-2 justify-center md:justify-start">
                Authenticity Verified
              </h2>
              <p className="text-xs text-muted-foreground mt-1">
                This batch is cryptographically signed and registered on the Stellar blockchain network.
              </p>
            </div>
          </div>
          <div className="text-center md:text-right border-t md:border-t-0 md:border-l border-border/40 pt-4 md:pt-0 md:pl-6">
            <span className="text-[10px] uppercase tracking-wider text-muted-foreground">Transaction Hash</span>
            <p className="text-xs font-mono font-medium text-foreground mt-1 truncate max-w-[200px]" title={product.txHash}>
              {product.txHash}
            </p>
          </div>
        </div>

        {/* Product Details Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Main Info */}
          <div className="md:col-span-2 glass-card p-8 rounded-2xl border border-border/40 space-y-6">
            <div>
              <span className="text-[10px] font-bold text-primary uppercase tracking-widest">Provenance Record</span>
              <h1 className="text-3xl font-extrabold tracking-tight mt-1">{product.name}</h1>
              <p className="text-sm font-mono text-muted-foreground mt-1">SKU: {product.sku}</p>
            </div>

            <div className="border-t border-border/40 pt-6 space-y-4">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Specification Metadata</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-xs text-muted-foreground block">Product ID</span>
                  <span className="font-mono font-medium">{product.id}</span>
                </div>
                <div>
                  <span className="text-xs text-muted-foreground block">Registered On Chain</span>
                  <span className="font-medium">{new Date(product.createdAt).toLocaleString()}</span>
                </div>
                <div className="sm:col-span-2">
                  <span className="text-xs text-muted-foreground block">Description & Attributes</span>
                  <p className="text-muted-foreground text-xs mt-1 leading-relaxed">
                    {product.description || 'No additional specifications registered.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* QR Code Tag Card */}
          <div className="glass-card p-8 rounded-2xl border border-border/40 flex flex-col items-center justify-center text-center gap-6">
            <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Product Identity Tag</h3>
            <div className="p-3 bg-white rounded-xl border border-gray-200 shadow-inner flex items-center justify-center">
              <QRCodeSVG
                value={getQRValue()}
                size={160}
                level="H"
                includeMargin={false}
              />
            </div>
            <div>
              <p className="text-xs font-semibold">Verify Provenance</p>
              <p className="text-[10px] text-muted-foreground mt-1 max-w-[200px]">
                Scan this tag to view the complete history and verify authenticity.
              </p>
            </div>
          </div>
        </div>

        {/* Ownership Timeline */}
        <div className="glass-card p-8 rounded-2xl border border-border/40 space-y-6">
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <User className="h-5 w-5 text-indigo-500" />
            Chain of Custody
          </h3>
          <div className="relative border-l border-border/60 ml-4 pl-8 space-y-8">
            {product.ownershipHistory.map((log, index) => (
              <div key={log.id} className="relative">
                {/* Timeline Dot */}
                <div className="absolute -left-[41px] top-1.5 h-6 w-6 rounded-full border border-primary/30 bg-background flex items-center justify-center">
                  <div className="h-2 w-2 rounded-full bg-primary" />
                </div>
                <div className="text-sm">
                  <div className="flex justify-between items-start gap-4">
                    <div>
                      <p className="font-semibold text-foreground">
                        {index === 0 ? 'MINTED & REGISTERED' : 'OWNERSHIP TRANSFERRED'}
                      </p>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        Recipient Address: <span className="font-mono font-medium text-foreground">{shortenAddress(log.toAddress)}</span>
                      </p>
                      {log.fromAddress !== log.toAddress && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          Sender Address: <span className="font-mono">{shortenAddress(log.fromAddress)}</span>
                        </p>
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground bg-secondary/30 border border-border/40 px-2 py-0.5 rounded-full">
                      {new Date(log.timestamp).toLocaleString()}
                    </span>
                  </div>
                  <p className="text-[10px] font-mono text-muted-foreground mt-2" title={log.txHash}>
                    Tx: {log.txHash}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Shipment History */}
        <div className="glass-card p-8 rounded-2xl border border-border/40 space-y-6">
          <h3 className="text-lg font-bold tracking-tight flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-500" />
            Shipment Tracking Logs
          </h3>
          {product.shipments.length === 0 ? (
            <p className="text-xs text-muted-foreground">No shipments have been dispatched for this product batch.</p>
          ) : (
            <div className="space-y-8">
              {product.shipments.map((shipment) => (
                <div key={shipment.id} className="border border-border/45 rounded-xl p-6 bg-secondary/10">
                  <div className="flex justify-between items-center mb-6 pb-4 border-b border-border/45">
                    <div>
                      <span className="text-[10px] text-muted-foreground uppercase tracking-widest">Shipment ID</span>
                      <p className="text-xs font-mono font-bold">{shipment.id}</p>
                    </div>
                    <span className="text-xs font-bold px-3 py-1 rounded-full uppercase tracking-wider bg-primary/10 text-primary border border-primary/20">
                      {shipment.status}
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs mb-6">
                    <div>
                      <span className="text-muted-foreground block">Route</span>
                      <span className="font-semibold flex items-center gap-1.5 mt-0.5">
                        {shipment.source} <ArrowRight className="h-3 w-3 text-muted-foreground" /> {shipment.destination}
                      </span>
                    </div>
                    <div>
                      <span className="text-muted-foreground block">Assigned Carrier</span>
                      <span className="font-semibold">{shipment.carrier.name}</span>
                    </div>
                  </div>

                  {/* Shipment Updates Timeline */}
                  {shipment.updates.length > 0 && (
                    <div className="space-y-4 border-t border-border/30 pt-4">
                      <p className="text-[10px] uppercase font-bold text-muted-foreground tracking-wider">Tracking checkpoints</p>
                      <div className="space-y-4 pl-4 border-l border-border/50">
                        {shipment.updates.map((update, uIdx) => (
                          <div key={update.timestamp} className="relative pl-6">
                            <div className="absolute -left-[21px] top-1.5 h-3.5 w-3.5 rounded-full border border-blue-500/50 bg-background flex items-center justify-center">
                              <div className="h-1.5 w-1.5 rounded-full bg-blue-500" />
                            </div>
                            <div className="text-xs flex flex-col sm:flex-row justify-between items-start sm:items-center gap-1">
                              <div>
                                <span className="font-bold text-foreground">{update.status}</span>
                                <span className="text-muted-foreground ml-2 flex items-center gap-1 inline-flex">
                                  <MapPin className="h-3 w-3" /> {update.location}
                                </span>
                                {update.description && (
                                  <p className="text-muted-foreground text-[10px] mt-0.5">{update.description}</p>
                                )}
                              </div>
                              <span className="text-[10px] text-muted-foreground">
                                {new Date(update.timestamp).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

      </main>
    </div>
  );
}

// Simple link import helper
import Link from 'next/link';
