'use strict';
'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, PieChart, Pie } from 'recharts';
import { Package, Truck, ArrowRightLeft, ShieldAlert, Award, Loader2, Landmark } from 'lucide-react';

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

interface AnalyticsData {
  metrics: Metrics;
  productsByStatus: StatusItem[];
  topManufacturers: ManufacturerItem[];
}

export default function DashboardPage() {
  const { publicKey, partnerProfile, isConnected } = useWallet();

  // Fetch analytics metrics
  const { data, isLoading, error } = useQuery<AnalyticsData>({
    queryKey: ['analytics-data'],
    queryFn: async () => {
      const res = await fetch('/api/analytics');
      if (!res.ok) throw new Error('Failed to load analytics metrics');
      return res.json();
    },
    enabled: isConnected && partnerProfile?.status === 'APPROVED',
  });

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-60 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              Please connect your Stellar wallet to view the analytics dashboard.
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
              Your business node operator account is currently pending administrator approval.
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

  const CHART_COLORS = ['#3b82f6', '#eab308', '#22c55e', '#64748b'];

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      {/* Stars/glow background */}
      <div className="absolute top-[-10%] right-[-10%] w-[50%] h-[50%] bg-primary/5 rounded-full blur-[150px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10 space-y-8">
        
        {/* Title */}
        <div className="mb-6">
          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-2">
            <Landmark className="h-7 w-7 text-primary" />
            TraceChain Node Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Real-time supply chain provenance analytics aggregated from Soroban Events and PostgreSQL cache
          </p>
        </div>

        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-32 gap-3">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
            <p className="text-sm text-muted-foreground">Compiling ledger telemetry...</p>
          </div>
        ) : error ? (
          <div className="text-center py-20 text-red-500 border border-border/40 rounded-2xl glass-panel">
            <p>Failed to aggregate analytics. Please verify database connection.</p>
          </div>
        ) : (
          <>
            {/* Aggregated metrics cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="glass-card p-6 rounded-xl border border-border/40 flex items-center gap-4">
                <div className="p-3 bg-blue-500/10 rounded-full text-blue-500">
                  <Package className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Minted Batches</span>
                  <p className="text-2xl font-bold mt-0.5">{metrics.totalProducts}</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-border/40 flex items-center gap-4">
                <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">In Transit</span>
                  <p className="text-2xl font-bold mt-0.5 text-yellow-500">{metrics.activeShipments}</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-border/40 flex items-center gap-4">
                <div className="p-3 bg-green-500/10 rounded-full text-green-500">
                  <Truck className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Delivered Cargo</span>
                  <p className="text-2xl font-bold mt-0.5 text-green-500">{metrics.completedShipments}</p>
                </div>
              </div>

              <div className="glass-card p-6 rounded-xl border border-border/40 flex items-center gap-4">
                <div className="p-3 bg-indigo-500/10 rounded-full text-indigo-500">
                  <ArrowRightLeft className="h-6 w-6" />
                </div>
                <div>
                  <span className="text-[10px] uppercase font-bold text-muted-foreground">Custody Changes</span>
                  <p className="text-2xl font-bold mt-0.5 text-indigo-500">{metrics.totalTransfers}</p>
                </div>
              </div>
            </div>

            {/* Charts section */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              
              {/* Bar Chart - Products By Status */}
              <div className="glass-card p-6 rounded-xl border border-border/40 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Product Batches by Status</h3>
                <div className="h-72 w-full">
                  {productsByStatus.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-muted-foreground">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={productsByStatus}>
                        <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                        <XAxis dataKey="status" stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <YAxis stroke="#888888" fontSize={11} tickLine={false} axisLine={false} />
                        <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.8)', border: 'none', borderRadius: '8px' }} />
                        <Bar dataKey="count" fill="#3b82f6" radius={[4, 4, 0, 0]}>
                          {productsByStatus.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  )}
                </div>
              </div>

              {/* Pie Chart - Top Manufacturers */}
              <div className="glass-card p-6 rounded-xl border border-border/40 space-y-4">
                <h3 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">Top Manufacturer Yield</h3>
                <div className="h-72 w-full flex items-center justify-center">
                  {topManufacturers.length === 0 ? (
                    <div className="text-xs text-muted-foreground">No data available</div>
                  ) : (
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topManufacturers}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={90}
                          paddingAngle={5}
                          dataKey="count"
                          label={({ name, percent }) => `${name} (${((percent || 0) * 100).toFixed(0)}%)`}
                        >
                          {topManufacturers.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ background: 'rgba(15, 23, 42, 0.8)', border: 'none', borderRadius: '8px' }} />
                      </PieChart>
                    </ResponsiveContainer>
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
