'use strict';
'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { StellarService } from '@/services/stellar';
import { Header } from '@/components/shared/Header';
import { Shield, CheckCircle, Clock } from 'lucide-react';

const formSchema = z.object({
  name: z.string().min(2, 'Company/Business name must be at least 2 characters'),
  role: z.enum(['MANUFACTURER', 'DISTRIBUTOR', 'LOGISTICS', 'RETAILER', 'CONSUMER']),
  email: z.string().email('Invalid email address').optional().or(z.literal('')),
});

type FormData = z.infer<typeof formSchema>;

export default function RegisterPage() {
  const { publicKey, isConnected, partnerProfile, refreshProfile, signTx } = useWallet();
  const { showToast, showTxToast } = useToast();
  const router = useRouter();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<FormData>({
    resolver: async (data, context, options) => {
      // Inline validator using zod to avoid external package resolution errors if resolver isn't installed
      try {
        const validated = formSchema.parse(data);
        return { values: validated, errors: {} };
      } catch (err: any) {
        const fieldErrors: any = {};
        err.errors?.forEach((e: any) => {
          fieldErrors[e.path[0]] = { message: e.message };
        });
        return { values: {}, errors: fieldErrors };
      }
    },
    defaultValues: {
      name: '',
      role: 'CONSUMER',
      email: '',
    },
  });

  // Redirect to dashboard if already approved
  useEffect(() => {
    if (partnerProfile && partnerProfile.status === 'APPROVED') {
      router.push('/dashboard');
    }
  }, [partnerProfile, router]);

  const onSubmit = async (data: FormData) => {
    if (!publicKey) return;

    try {
      // Step 1: Call the on-chain Partner Registry contract to register this wallet.
      // This requires the user to sign the transaction with Freighter.
      // The wallet will remain PENDING until the admin approves it on-chain.
      const txToast = showTxToast(`Registering ${data.name} on Stellar`);

      await StellarService.registerPartner(
        data.name,
        data.role,
        { onStepChange: (step) => txToast.updateStep(step) },
        publicKey,
        signTx
      );

      showToast(
        'Registration Submitted On-Chain',
        'Your partner request is pending admin approval. You will be notified once approved.',
        'success'
      );
      await refreshProfile(publicKey);

      if (data.role === 'CONSUMER') {
        router.push('/dashboard');
      }
    } catch (err: any) {
      console.error('Registration error:', err);
      showToast('Registration Failed', err.message || 'Something went wrong. Please try again.', 'error');
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <Header />
      
      <main className="flex-1 flex items-center justify-center p-6 relative overflow-hidden">
        {/* Glow effect background */}
        <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-primary/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="w-full max-w-md glass-card p-8 rounded-2xl relative z-10 shadow-xl border border-border/40">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/75 bg-clip-text text-transparent">
              TraceChain Partner Registration
            </h2>
            <p className="text-sm text-muted-foreground mt-2">
              Register your business wallet to join the Supply Chain network
            </p>
          </div>

          {!isConnected ? (
            <div className="text-center py-6 flex flex-col items-center gap-4">
              <Shield className="h-12 w-12 text-muted-foreground opacity-60" />
              <p className="text-sm text-muted-foreground">
                Please connect your Stellar wallet using the button in the header to register.
              </p>
            </div>
          ) : partnerProfile && partnerProfile.status === 'PENDING' ? (
            <div className="text-center py-6 flex flex-col items-center gap-4">
              <Clock className="h-12 w-12 text-yellow-500 animate-pulse" />
              <h3 className="text-lg font-semibold">Registration Pending</h3>
              <p className="text-sm text-muted-foreground">
                Your request for role <strong className="text-foreground">{partnerProfile.role}</strong> is currently pending administrator approval.
              </p>
            </div>
          ) : partnerProfile && partnerProfile.status === 'REJECTED' ? (
            <div className="text-center py-6 flex flex-col items-center gap-4">
              <Shield className="h-12 w-12 text-red-500" />
              <h3 className="text-lg font-semibold text-red-500 font-medium">Request Rejected</h3>
              <p className="text-sm text-muted-foreground">
                Your request has been rejected. Please contact support or re-register.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Business / Company Name
                </label>
                <input
                  type="text"
                  placeholder="Enter business name"
                  {...register('name')}
                  className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
                />
                {errors.name && (
                  <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Select Role
                </label>
                <select
                  {...register('role')}
                  className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
                >
                  <option value="CONSUMER">Consumer / Public Scanner</option>
                  <option value="MANUFACTURER">Manufacturer</option>
                  <option value="DISTRIBUTOR">Distributor</option>
                  <option value="LOGISTICS">Logistics Provider</option>
                  <option value="RETAILER">Retailer</option>
                </select>
                {errors.role && (
                  <p className="text-xs text-red-500 mt-1">{errors.role.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Email Address (Optional)
                </label>
                <input
                  type="email"
                  placeholder="contact@business.com"
                  {...register('email')}
                  className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/80 focus:ring-1 focus:ring-primary/80"
                />
                {errors.email && (
                  <p className="text-xs text-red-500 mt-1">{errors.email.message}</p>
                )}
              </div>

              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-semibold py-2.5 rounded-lg text-sm transition-all focus:outline-none focus:ring-2 focus:ring-primary/50 disabled:opacity-50 flex items-center justify-center"
              >
                {isSubmitting ? 'Submitting Request...' : 'Register Business'}
              </button>
            </form>
          )}
        </div>
      </main>
    </div>
  );
}
