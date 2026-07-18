'use strict';
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Info, X } from 'lucide-react';

export type ToastType = 'success' | 'error' | 'warning' | 'info' | 'tx_status';

export type TxStep =
  | 'preparing'
  | 'signing'
  | 'submitted'
  | 'confirming'
  | 'confirmed'
  | 'failed'
  | 'cancelled';

export interface Toast {
  id: string;
  title: string;
  message?: string;
  type: ToastType;
  txStep?: TxStep;
  duration?: number;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (title: string, message?: string, type?: ToastType, duration?: number) => string;
  dismissToast: (id: string) => void;
  showTxToast: (title: string, initialStep?: TxStep) => {
    id: string;
    updateStep: (step: TxStep, message?: string) => void;
    dismiss: () => void;
  };
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

/**
 * Parses raw Soroban/Stellar HostError strings into clean, user-friendly messages.
 */
function parseToastMessage(message: string): string {
  if (!message) return message;

  // Soroban HostError: extract the meaningful part
  if (message.includes('HostError:')) {
    // Try to extract the error type
    const errorTypeMatch = message.match(/Error\(([^)]+)\)/);
    const trapMatch = message.match(/VM call trapped: (\w+)/);
    const contractErrMatch = message.match(/VM call failed: (\w+)/);
    const panicMatch = message.match(/"([^"]+)",\s*\w+_product/);

    if (trapMatch?.[1] === 'UnreachableCodeReached') {
      return 'Your wallet is not approved in the Partner Registry. Ask the admin to approve your registration on-chain first.';
    }
    if (contractErrMatch?.[1] === 'MismatchingParameterLen') {
      return 'Contract call has wrong number of arguments. This is a code error — please report it.';
    }
    if (errorTypeMatch) {
      return `Smart contract error: ${errorTypeMatch[1]}. Check that your wallet is registered and approved.`;
    }
    return 'Transaction rejected by the Soroban smart contract.';
  }

  // Already-rejected wallet error
  if (message.toLowerCase().includes('not approved') || message.toLowerCase().includes('unauthorized')) {
    return 'Your wallet is not approved for this action. Contact the administrator.';
  }

  // Transaction rejected by user
  if (message.toLowerCase().includes('rejected') || message.toLowerCase().includes('user rejected')) {
    return 'You cancelled the transaction in your wallet.';
  }

  // Truncate if still too long
  if (message.length > 200) {
    return message.substring(0, 200) + '…';
  }

  return message;
}

function getStepMessage(step: TxStep): string {
  switch (step) {
    case 'preparing':
      return 'Preparing Transaction...';
    case 'signing':
      return 'Wallet Signature Required';
    case 'submitted':
      return 'Transaction Submitted';
    case 'confirming':
      return 'Waiting for Confirmation';
    case 'confirmed':
      return 'Transaction Confirmed!';
    case 'failed':
      return 'Transaction Failed';
    case 'cancelled':
      return 'Transaction Cancelled';
    default:
      return '';
  }
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showToast = useCallback((
    title: string,
    message?: string,
    type: ToastType = 'info',
    duration = 5000
  ) => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [...prev, { id, title, message, type, duration }]);

    if (duration > 0) {
      setTimeout(() => {
        dismissToast(id);
      }, duration);
    }

    return id;
  }, [dismissToast]);

  const showTxToast = useCallback((title: string, initialStep: TxStep = 'preparing') => {
    const id = Math.random().toString(36).substring(2, 9);
    setToasts((prev) => [
      ...prev,
      { id, title, message: getStepMessage(initialStep), type: 'tx_status', txStep: initialStep, duration: 0 }
    ]);

    const updateStep = (step: TxStep, message?: string) => {
      setToasts((prev) =>
        prev.map((t) =>
          t.id === id
            ? {
                ...t,
                txStep: step,
                message: message || getStepMessage(step),
                // Auto-dismiss after 4 seconds if transaction is finalized
                duration: step === 'confirmed' || step === 'failed' || step === 'cancelled' ? 4000 : 0
              }
            : t
        )
      );

      if (step === 'confirmed' || step === 'failed' || step === 'cancelled') {
        setTimeout(() => {
          dismissToast(id);
        }, 4000);
      }
    };

    return {
      id,
      updateStep,
      dismiss: () => dismissToast(id),
    };
  }, [dismissToast]);

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, showTxToast }}>
      {children}
      {/* Toast Render Component */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-3 w-[360px] max-w-[calc(100vw-2rem)]">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`bg-card border rounded-xl shadow-lg flex gap-3 items-start p-4 animate-in slide-in-from-bottom-2 duration-300 ${
              toast.type === 'error'   ? 'border-red-500/30'    :
              toast.type === 'success' ? 'border-green-500/30'  :
              toast.type === 'warning' ? 'border-yellow-500/30' :
              toast.type === 'tx_status' && toast.txStep === 'failed' ? 'border-red-500/30' :
              toast.type === 'tx_status' && toast.txStep === 'confirmed' ? 'border-green-500/30' :
              'border-border/50'
            }`}
          >
            <div className="mt-0.5 shrink-0">
              {toast.type === 'success' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
              {toast.type === 'error' && <XCircle className="h-5 w-5 text-red-500" />}
              {toast.type === 'warning' && <AlertTriangle className="h-5 w-5 text-yellow-500" />}
              {toast.type === 'info' && <Info className="h-5 w-5 text-blue-500" />}
              {toast.type === 'tx_status' && (
                <>
                  {(toast.txStep === 'preparing' ||
                    toast.txStep === 'signing' ||
                    toast.txStep === 'submitted' ||
                    toast.txStep === 'confirming') && (
                    <Loader2 className="h-5 w-5 text-primary animate-spin" />
                  )}
                  {toast.txStep === 'confirmed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {toast.txStep === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                  {toast.txStep === 'cancelled' && <XCircle className="h-5 w-5 text-muted-foreground" />}
                </>
              )}
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">{toast.title}</h4>
              {toast.message && (
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed line-clamp-3 break-words">
                  {parseToastMessage(toast.message)}
                </p>
              )}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="shrink-0 text-muted-foreground hover:text-foreground transition-colors ml-1"
              aria-label="Dismiss"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}
