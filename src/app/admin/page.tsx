'use strict';
'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { StellarService, CONTRACT_ADDRESSES } from '@/services/stellar';
import {
  ShieldAlert, Loader2, Users, Package, Truck, ArrowRightLeft,
  ExternalLink, Copy, CheckCircle, Activity, Code, Globe, RefreshCw,
} from 'lucide-react';

interface Partner { walletAddress: string; name: string; role: string; status: string; createdAt: string; }
interface Product { id: string; name: string; sku: string; status: string; manufacturer: { name: string }; createdAt: string; }
interface Shipment { id: string; productId: string; status: string; source: string; destination: string; createdAt: string; product: { name: string }; }

type TabId = 'overview' | 'contracts' | 'partners' | 'products' | 'shipments';

export default function AdminPage() {
  const { publicKey, isConnected } = useWallet();
  const { showToast } = useToast();
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [copied, setCopied] = useState<string | null>(null);

  const { data: partnersData, isLoading: loadingPartners } = useQuery<{ partners: Partner[] }>({
    queryKey: ['admin-partners'],
    queryFn: async () => { const r = await fetch('/api/admin/partners'); return r.json(); },
    enabled: isConnected,
  });

  const { data: productsData, isLoading: loadingProducts } = useQuery<{ products: Product[] }>({
    queryKey: ['admin-products'],
    queryFn: async () => { const r = await fetch('/api/products'); return r.json(); },
    enabled: isConnected,
  });

  const { data: shipmentsData, isLoading: loadingShipments } = useQuery<{ shipments: Shipment[] }>({
    queryKey: ['admin-shipments'],
    queryFn: async () => { const r = await fetch('/api/shipments'); return r.json(); },
    enabled: isConnected,
  });

  const partners  = partnersData?.partners  || [];
  const products  = productsData?.products  || [];
  const shipments = shipmentsData?.shipments || [];

  const copyToClipboard = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const contracts = [
    { name: 'Partner Registry', desc: 'Manages approved supply chain participants', id: CONTRACT_ADDRESSES.PARTNER_REGISTRY, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20' },
    { name: 'Product Registry', desc: 'Mints and tracks product NFTs on-chain', id: CONTRACT_ADDRESSES.PRODUCT_REGISTRY, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20' },
    { name: 'Ownership',        desc: 'Records custody transfer history', id: CONTRACT_ADDRESSES.OWNERSHIP, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' },
    { name: 'Shipment',         desc: 'Tracks logistics and delivery status', id: CONTRACT_ADDRESSES.SHIPMENT, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20' },
  ];

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: 'overview',   label: 'Overview',          icon: <Activity className="h-4 w-4" /> },
    { id: 'contracts',  label: 'Smart Contracts',   icon: <Code className="h-4 w-4" /> },
    { id: 'partners',   label: `Partners (${partners.length})`,  icon: <Users className="h-4 w-4" /> },
    { id: 'products',   label: `Products (${products.length})`,  icon: <Package className="h-4 w-4" /> },
    { id: 'shipments',  label: `Shipments (${shipments.length})`,icon: <Truck className="h-4 w-4" /> },
  ];

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-60 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Wallet Required</h3>
            <p className="text-sm text-muted-foreground">
              Connect your Freighter wallet to access the blockchain admin console.
            </p>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">

        {/* Title */}
        <div className="mb-8 pb-6 border-b border-border/30 flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Blockchain Admin Console</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Monitor and operate all Soroban smart contracts on Stellar Testnet
            </p>
          </div>
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full border border-green-500/30 bg-green-500/5 text-xs font-semibold text-green-400">
            <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
            Testnet Live
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 border-b border-border/30 overflow-x-auto">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              {tab.icon}
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {[
                { label: 'Total Partners', value: partners.length, color: 'text-violet-400', bg: 'bg-violet-500/10' },
                { label: 'Registered Products', value: products.length, color: 'text-blue-400', bg: 'bg-blue-500/10' },
                { label: 'Active Shipments', value: shipments.filter(s => s.status !== 'DELIVERED').length, color: 'text-orange-400', bg: 'bg-orange-500/10' },
                { label: 'Delivered', value: shipments.filter(s => s.status === 'DELIVERED').length, color: 'text-emerald-400', bg: 'bg-emerald-500/10' },
              ].map((kpi) => (
                <div key={kpi.label} className={`glass-card p-5 rounded-xl border border-border/40 ${kpi.bg}`}>
                  <p className="text-xs text-muted-foreground uppercase font-bold tracking-wider">{kpi.label}</p>
                  <p className={`text-3xl font-extrabold mt-1 ${kpi.color}`}>{kpi.value}</p>
                </div>
              ))}
            </div>

            {/* Connected Wallet */}
            <div className="glass-card p-6 rounded-xl border border-border/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Connected Admin Wallet</h3>
              <div className="flex items-center justify-between gap-4">
                <code className="text-xs font-mono text-primary break-all">{publicKey}</code>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(publicKey!, 'wallet')}
                    className="p-2 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors"
                    title="Copy address"
                  >
                    {copied === 'wallet' ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <a
                    href={`https://stellar.expert/explorer/testnet/account/${publicKey}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors"
                    title="View on Stellar Expert"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            </div>

            {/* Quick Actions */}
            <div className="glass-card p-6 rounded-xl border border-border/40">
              <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-4">Quick Blockchain Actions</h3>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                {[
                  { href: '/marketplace/new', label: 'Register Product', icon: <Package className="h-4 w-4" />, color: 'bg-blue-500/10 text-blue-400 border-blue-500/20 hover:bg-blue-500/20' },
                  { href: '/ownership',       label: 'Transfer Ownership', icon: <ArrowRightLeft className="h-4 w-4" />, color: 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20 hover:bg-indigo-500/20' },
                  { href: '/shipments',       label: 'Create Shipment', icon: <Truck className="h-4 w-4" />, color: 'bg-orange-500/10 text-orange-400 border-orange-500/20 hover:bg-orange-500/20' },
                  { href: '/marketplace',     label: 'View Products', icon: <Package className="h-4 w-4" />, color: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20 hover:bg-emerald-500/20' },
                  { href: '/portfolio',       label: 'View Inventory', icon: <Users className="h-4 w-4" />, color: 'bg-violet-500/10 text-violet-400 border-violet-500/20 hover:bg-violet-500/20' },
                  { href: '/dashboard',       label: 'Analytics', icon: <Activity className="h-4 w-4" />, color: 'bg-pink-500/10 text-pink-400 border-pink-500/20 hover:bg-pink-500/20' },
                ].map((action) => (
                  <a
                    key={action.href}
                    href={action.href}
                    className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-semibold transition-all ${action.color}`}
                  >
                    {action.icon}
                    {action.label}
                  </a>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Smart Contracts Tab */}
        {activeTab === 'contracts' && (
          <div className="space-y-4">
            {contracts.map((c) => (
              <div key={c.id} className={`glass-card p-6 rounded-xl border ${c.color} flex flex-col sm:flex-row sm:items-center gap-4`}>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Code className="h-4 w-4" />
                    <span className="font-bold text-sm">{c.name}</span>
                  </div>
                  <p className="text-xs text-muted-foreground mb-2">{c.desc}</p>
                  <code className="text-[11px] font-mono break-all opacity-80">{c.id}</code>
                </div>
                <div className="flex gap-2 shrink-0">
                  <button
                    onClick={() => copyToClipboard(c.id, c.name)}
                    className="p-2 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors"
                    title="Copy contract ID"
                  >
                    {copied === c.name ? <CheckCircle className="h-4 w-4 text-green-500" /> : <Copy className="h-4 w-4" />}
                  </button>
                  <a
                    href={`https://stellar.expert/explorer/testnet/contract/${c.id}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-2 rounded-lg border border-border/40 hover:bg-secondary/50 transition-colors"
                    title="View on Stellar Expert"
                  >
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Partners Tab */}
        {activeTab === 'partners' && (
          <div className="glass-card rounded-xl border border-border/40 overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h3 className="font-bold">Registered Network Partners</h3>
              <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-partners'] })} className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors">
                <RefreshCw className="h-4 w-4" />
              </button>
            </div>
            {loadingPartners ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
            ) : partners.length === 0 ? (
              <p className="text-center py-16 text-sm text-muted-foreground">No partners registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-border/30 bg-secondary/5">
                    <tr>
                      {['Name', 'Stellar Address', 'Role', 'Status'].map(h => (
                        <th key={h} className="py-3 px-4 uppercase font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {partners.map((p) => (
                      <tr key={p.walletAddress} className="border-b border-border/20 hover:bg-secondary/10">
                        <td className="py-3 px-4 font-semibold">{p.name}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{p.walletAddress.substring(0, 8)}…{p.walletAddress.substring(48)}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-secondary text-[10px] font-bold">{p.role}</span></td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${p.status === 'APPROVED' ? 'bg-green-500/10 text-green-400' : p.status === 'PENDING' ? 'bg-yellow-500/10 text-yellow-400' : 'bg-red-500/10 text-red-400'}`}>
                            {p.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="glass-card rounded-xl border border-border/40 overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h3 className="font-bold">All On-Chain Products</h3>
              <div className="flex gap-2">
                <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-products'] })} className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <a href="/marketplace/new" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                  <Package className="h-3.5 w-3.5" /> Register New
                </a>
              </div>
            </div>
            {loadingProducts ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
            ) : products.length === 0 ? (
              <p className="text-center py-16 text-sm text-muted-foreground">No products registered yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-border/30 bg-secondary/5">
                    <tr>
                      {['Product Name', 'SKU', 'Manufacturer', 'Status', 'Explorer'].map(h => (
                        <th key={h} className="py-3 px-4 uppercase font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {products.map((p) => (
                      <tr key={p.id} className="border-b border-border/20 hover:bg-secondary/10">
                        <td className="py-3 px-4 font-semibold">{p.name}</td>
                        <td className="py-3 px-4 font-mono text-muted-foreground">{p.sku}</td>
                        <td className="py-3 px-4">{p.manufacturer?.name || '—'}</td>
                        <td className="py-3 px-4"><span className="px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-400 text-[10px] font-bold">{p.status}</span></td>
                        <td className="py-3 px-4">
                          <a href={`/product/${p.id}`} className="flex items-center gap-1 text-primary hover:underline">
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* Shipments Tab */}
        {activeTab === 'shipments' && (
          <div className="glass-card rounded-xl border border-border/40 overflow-hidden">
            <div className="p-4 border-b border-border/30 flex items-center justify-between">
              <h3 className="font-bold">All On-Chain Shipments</h3>
              <div className="flex gap-2">
                <button onClick={() => queryClient.invalidateQueries({ queryKey: ['admin-shipments'] })} className="p-1.5 hover:bg-secondary/50 rounded-lg transition-colors">
                  <RefreshCw className="h-4 w-4" />
                </button>
                <a href="/shipments" className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground rounded-lg text-xs font-semibold hover:bg-primary/90 transition-colors">
                  <Truck className="h-3.5 w-3.5" /> Create Shipment
                </a>
              </div>
            </div>
            {loadingShipments ? (
              <div className="flex justify-center py-16"><Loader2 className="h-8 w-8 text-primary animate-spin" /></div>
            ) : shipments.length === 0 ? (
              <p className="text-center py-16 text-sm text-muted-foreground">No shipments created yet.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs text-left">
                  <thead className="border-b border-border/30 bg-secondary/5">
                    <tr>
                      {['Product', 'Route', 'Status', 'Created'].map(h => (
                        <th key={h} className="py-3 px-4 uppercase font-semibold text-muted-foreground">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {shipments.map((s) => (
                      <tr key={s.id} className="border-b border-border/20 hover:bg-secondary/10">
                        <td className="py-3 px-4 font-semibold">{s.product?.name || s.productId}</td>
                        <td className="py-3 px-4 text-muted-foreground">{s.source} → {s.destination}</td>
                        <td className="py-3 px-4">
                          <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            s.status === 'DELIVERED'  ? 'bg-green-500/10 text-green-400' :
                            s.status === 'IN_TRANSIT' ? 'bg-blue-500/10 text-blue-400'  :
                            s.status === 'CANCELLED'  ? 'bg-red-500/10 text-red-400'    :
                            'bg-yellow-500/10 text-yellow-400'
                          }`}>{s.status}</span>
                        </td>
                        <td className="py-3 px-4 text-muted-foreground">{new Date(s.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

      </main>
    </div>
  );
}
