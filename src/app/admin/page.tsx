'use strict';
'use client';

import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { ShieldCheck, ShieldAlert, Loader2, Check, X, Users, CheckSquare, Clock } from 'lucide-react';

interface Partner {
  walletAddress: string;
  name: string;
  role: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  email: string | null;
  createdAt: string;
}

export default function AdminPage() {
  const { publicKey, partnerProfile, isConnected } = useWallet();
  const { showToast } = useToast();
  const queryClient = useQueryClient();

  const [submittingId, setSubmittingId] = useState<string | null>(null);

  // Fetch registered partners
  const { data, isLoading } = useQuery<{ partners: Partner[] }>({
    queryKey: ['admin-partners'],
    queryFn: async () => {
      const res = await fetch('/api/admin/partners');
      if (!res.ok) throw new Error('Failed to load partners list');
      return res.json();
    },
    enabled: isConnected && partnerProfile?.role === 'ADMIN',
  });

  const partners = data?.partners || [];
  const pendingPartners = partners.filter((p) => p.status === 'PENDING');
  const activePartners = partners.filter((p) => p.status === 'APPROVED');

  const handleApproveReject = async (partnerAddress: string, approve: boolean) => {
    setSubmittingId(partnerAddress);
    try {
      const res = await fetch('/api/admin/partners/approve', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          walletAddress: partnerAddress,
          approve,
        }),
      });

      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || 'Failed to update partner');

      showToast(
        'Status Updated',
        `Partner successfully ${approve ? 'approved' : 'rejected'}.`,
        'success'
      );
      queryClient.invalidateQueries({ queryKey: ['admin-partners'] });
    } catch (err: any) {
      showToast('Error', err.message || 'Operation failed', 'error');
    } finally {
      setSubmittingId(null);
    }
  };

  const isApprovedAdmin = partnerProfile?.role === 'ADMIN' && partnerProfile?.status === 'APPROVED';

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-muted-foreground opacity-60 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Authentication Required</h3>
            <p className="text-sm text-muted-foreground">
              Please connect your Administrator wallet to access the control panel.
            </p>
          </div>
        </main>
      </div>
    );
  }

  if (!isApprovedAdmin) {
    return (
      <div className="min-h-screen bg-background text-foreground flex flex-col">
        <Header />
        <main className="flex-1 flex flex-col items-center justify-center p-6 text-center">
          <div className="glass-card max-w-md p-8 rounded-2xl border border-border/40 shadow-lg">
            <ShieldAlert className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-xl font-bold mb-2">Access Denied</h3>
            <p className="text-sm text-muted-foreground">
              Only approved System Administrators are authorized to view this page.
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
        <div className="mb-8 pb-6 border-b border-border/30">
          <h1 className="text-3xl font-extrabold tracking-tight">System Admin Console</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Review registration requests, approve manufacturers/distributors, and manage partner nodes
          </p>
        </div>

        {/* Stats summary banner */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mb-8">
          <div className="glass-card p-6 rounded-xl border border-border/40 flex items-center gap-4">
            <div className="p-3 bg-primary/10 rounded-full text-primary">
              <Users className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Total Node Partners</span>
              <p className="text-2xl font-bold mt-0.5">{partners.length}</p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-border/40 flex items-center gap-4">
            <div className="p-3 bg-yellow-500/10 rounded-full text-yellow-500">
              <Clock className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Pending Approvals</span>
              <p className="text-2xl font-bold mt-0.5 text-yellow-500">{pendingPartners.length}</p>
            </div>
          </div>

          <div className="glass-card p-6 rounded-xl border border-border/40 flex items-center gap-4">
            <div className="p-3 bg-green-500/10 rounded-full text-green-500">
              <CheckSquare className="h-6 w-6" />
            </div>
            <div>
              <span className="text-[10px] uppercase font-bold text-muted-foreground">Active Node Operators</span>
              <p className="text-2xl font-bold mt-0.5 text-green-500">{activePartners.length}</p>
            </div>
          </div>
        </div>

        {/* Dynamic tables grid */}
        <div className="grid grid-cols-1 gap-8">
          
          {/* Pending Partners */}
          <div className="glass-card p-6 rounded-xl border border-border/40">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Clock className="h-5 w-5 text-yellow-500" />
              Pending Registration Requests
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : pendingPartners.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border/40 rounded-lg">
                No pending registration requests to review.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground">
                      <th className="py-3 px-4 uppercase font-semibold">Business Name</th>
                      <th className="py-3 px-4 uppercase font-semibold">Stellar Address</th>
                      <th className="py-3 px-4 uppercase font-semibold">Requested Role</th>
                      <th className="py-3 px-4 uppercase font-semibold">Email</th>
                      <th className="py-3 px-4 uppercase font-semibold text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pendingPartners.map((partner) => (
                      <tr key={partner.walletAddress} className="border-b border-border/30 hover:bg-secondary/10">
                        <td className="py-4 px-4 font-bold text-foreground">{partner.name}</td>
                        <td className="py-4 px-4 font-mono">{partner.walletAddress.substring(0, 10)}...{partner.walletAddress.substring(46)}</td>
                        <td className="py-4 px-4"><span className="bg-secondary px-2 py-0.5 rounded-full font-semibold">{partner.role}</span></td>
                        <td className="py-4 px-4">{partner.email || 'N/A'}</td>
                        <td className="py-4 px-4 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleApproveReject(partner.walletAddress, false)}
                              disabled={submittingId === partner.walletAddress}
                              className="p-1.5 rounded-lg border border-red-500/20 bg-red-500/5 hover:bg-red-500/10 text-red-500 disabled:opacity-50"
                              title="Reject Partner"
                            >
                              <X className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => handleApproveReject(partner.walletAddress, true)}
                              disabled={submittingId === partner.walletAddress}
                              className="p-1.5 rounded-lg border border-green-500/20 bg-green-500/5 hover:bg-green-500/10 text-green-500 disabled:opacity-50"
                              title="Approve Partner"
                            >
                              <Check className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Active Partners */}
          <div className="glass-card p-6 rounded-xl border border-border/40">
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-green-500" />
              Active System Nodes
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 text-primary animate-spin" />
              </div>
            ) : activePartners.length === 0 ? (
              <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border/40 rounded-lg">
                No active node operators registered.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead>
                    <tr className="border-b border-border/40 text-muted-foreground">
                      <th className="py-3 px-4 uppercase font-semibold">Business Name</th>
                      <th className="py-3 px-4 uppercase font-semibold">Stellar Address</th>
                      <th className="py-3 px-4 uppercase font-semibold">Registered Role</th>
                      <th className="py-3 px-4 uppercase font-semibold">Email</th>
                      <th className="py-3 px-4 uppercase font-semibold">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {activePartners.map((partner) => (
                      <tr key={partner.walletAddress} className="border-b border-border/30">
                        <td className="py-4 px-4 font-bold text-foreground">{partner.name}</td>
                        <td className="py-4 px-4 font-mono">{partner.walletAddress.substring(0, 10)}...{partner.walletAddress.substring(46)}</td>
                        <td className="py-4 px-4"><span className="bg-secondary px-2 py-0.5 rounded-full font-semibold">{partner.role}</span></td>
                        <td className="py-4 px-4">{partner.email || 'N/A'}</td>
                        <td className="py-4 px-4">
                          <span className="inline-flex items-center gap-1 text-green-500 font-semibold bg-green-500/5 border border-green-500/20 px-2.5 py-0.5 rounded-full">
                            <ShieldCheck className="h-3.5 w-3.5" /> Approved
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </main>
    </div>
  );
}
