'use strict';
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Package, Truck, ArrowRightLeft, ShieldAlert, Loader2, Landmark, CheckCircle, Clock } from 'lucide-react';
import Link from 'next/link';

interface Metrics {
  totalProducts: number;
  activeShipments: number;
  completedShipments: number;
  totalTransfers: number;
}

interface StatusItem {
  status: string;
  count: number;
}

interface ManufacturerItem {
  name: string;
  count: number;
}

interface ShipmentItem {
  id: string;
  productId: string;
  status: string;
  createdAt: string;
  txHash: string;
}

interface AnalyticsData {
  metrics: Metrics;
  productsByStatus: StatusItem[];
  topManufacturers: ManufacturerItem[];
  recentShipments?: ShipmentItem[];
}

export default function DashboardPage() {
  const { publicKey, isConnected, activeRole } = useWallet();

  // Fetch analytics metrics
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['analytics-data'],
    queryFn: async () => {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to load analytics metrics');
      return res.json();
    },
    enabled: isConnected,
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground factora-grid flex flex-col relative overflow-hidden">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="bg-card max-w-md p-10 rounded-3xl border border-border shadow-xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-blue-500 to-indigo-500" />
            <ShieldAlert className="h-16 w-16 text-muted-foreground opacity-30 mx-auto mb-6" />
            <h3 className="text-2xl font-bold mb-3 text-card-foreground">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              Please connect your Stellar wallet to access your SaaS analytics dashboard.
            </p>
          </div>
        </main>
      </div>
    );
  }

  const metrics = data?.metrics || {
    totalProducts: 0,
    activeShipments: 0,
    completedShipments: 0,
    totalTransfers: 0,
  };

  const productsByStatus = data?.productsByStatus || [];
  const topManufacturers = data?.topManufacturers || [];
  const recentShipments = data?.recentShipments || [];

  const CHART_COLORS = ['#3b82f6', '#eab308', '#22c55e', '#64748b'];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'DELIVERED':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-100 text-green-700 text-[10px] font-bold tracking-wide"><CheckCircle className="h-3 w-3" /> DELIVERED</span>;
      case 'IN_TRANSIT':
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-yellow-100 text-yellow-700 text-[10px] font-bold tracking-wide"><Truck className="h-3 w-3" /> IN TRANSIT</span>;
      default:
        return <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-100 text-slate-700 text-[10px] font-bold tracking-wide"><Clock className="h-3 w-3" /> {status}</span>;
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground factora-grid flex flex-col relative overflow-hidden">
      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-10 relative z-10 space-y-10">
        
        {/* Header Section */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <div className="inline-flex items-center justify-center gap-2 px-3 py-1 rounded-full border border-primary/20 bg-primary/5 text-[10px] font-bold tracking-widest text-primary mb-3 uppercase">
              {activeRole} DASHBOARD
            </div>
            <h1 className="text-3xl md:text-4xl font-extrabold tracking-tight text-foreground">
              Platform Analytics
            </h1>
            <p className="text-sm text-muted-foreground mt-2 max-w-xl">
              Real-time supply chain provenance analytics aggregated from Soroban smart contracts.
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/marketplace/new" className="bg-primary hover:bg-primary/90 text-white px-5 py-2.5 rounded-lg text-sm font-semibold transition-all shadow-sm">
              + New Batch
            </Link>
          </div>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-4">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm font-medium text-muted-foreground">Syncing with Stellar Network...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 bg-red-50 border border-red-100 rounded-3xl">
            <p className="font-semibold">Failed to aggregate analytics.</p>
          </div>
        ) : (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: 'Total Products', value: metrics.totalProducts, icon: Package, color: 'text-blue-600', bg: 'bg-blue-50 border-blue-100' },
                { label: 'Active Shipments', value: metrics.activeShipments, icon: Truck, color: 'text-amber-600', bg: 'bg-amber-50 border-amber-100' },
                { label: 'Completed Deliveries', value: metrics.completedShipments, icon: CheckCircle, color: 'text-emerald-600', bg: 'bg-emerald-50 border-emerald-100' },
                { label: 'Custody Transfers', value: metrics.totalTransfers, icon: ArrowRightLeft, color: 'text-indigo-600', bg: 'bg-indigo-50 border-indigo-100' },
              ].map((kpi, idx) => (
                <div key={idx} className="bg-card p-6 rounded-2xl border border-border shadow-sm hover:shadow-md transition-shadow relative overflow-hidden group">
                  <div className={`absolute -right-6 -top-6 w-24 h-24 rounded-full ${kpi.bg} opacity-50 group-hover:scale-150 transition-transform duration-500`} />
                  <div className="flex items-center gap-4 relative z-10">
                    <div className={`p-3 rounded-xl ${kpi.bg} ${kpi.color}`}>
                      <kpi.icon className="h-6 w-6" />
                    </div>
                    <div>
                      <span className="text-[11px] uppercase font-bold text-muted-foreground tracking-wider">{kpi.label}</span>
                      <p className="text-3xl font-extrabold text-card-foreground mt-1">{kpi.value.toLocaleString()}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Charts & Activity Feed */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              
              {/* Main Chart */}
              <div className="lg:col-span-2 bg-card p-8 rounded-3xl border border-border shadow-sm">
                <div className="flex justify-between items-center mb-8">
                  <h3 className="text-base font-bold text-card-foreground">Product Batches by Status</h3>
                </div>
                <div className="h-[300px] w-full">
                  {productsByStatus.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-sm text-slate-400">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={productsByStatus}>
                        <defs>
                          <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                        <XAxis dataKey="status" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                        <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dx={-10} />
                        <Tooltip 
                          contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '12px', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} 
                          itemStyle={{ color: '#0f172a', fontWeight: 'bold' }}
                        />
                        <Area type="monotone" dataKey="count" stroke="#3b82f6" strokeWidth={3} fillOpacity={1} fill="url(#colorCount)" />
                      </AreaChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Recent Activity */}
              <div className="bg-card p-8 rounded-3xl border border-border shadow-sm flex flex-col">
                <h3 className="text-base font-bold text-card-foreground mb-6">Recent Network Activity</h3>
                <div className="flex-1 overflow-y-auto pr-2 space-y-5">
                  {recentShipments.length === 0 ? (
                    <div className="text-sm text-slate-400 text-center mt-10">No recent activity found.</div>
                  ) : (
                    recentShipments.map((ship, idx) => (
                      <div key={ship.id} className="flex gap-4 relative">
                        {idx !== recentShipments.length - 1 && (
                          <div className="absolute left-[11px] top-8 w-[2px] h-[calc(100%-8px)] bg-muted" />
                        )}
                        <div className="relative z-10 w-6 h-6 rounded-full bg-blue-100 flex items-center justify-center shrink-0 mt-0.5">
                          <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                        </div>
                        <div className="flex-1 pb-1">
                          <div className="flex justify-between items-start mb-1">
                            <p className="text-sm font-semibold text-card-foreground">Shipment Created</p>
                            <span className="text-[10px] text-muted-foreground font-mono">{new Date(ship.createdAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}</span>
                          </div>
                          <p className="text-xs text-muted-foreground mb-2">ID: <span className="font-mono">{ship.id}</span></p>
                          {getStatusBadge(ship.status)}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </>
        )}
      </main>
    </div>
  );
}
