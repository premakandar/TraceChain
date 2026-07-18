'use strict';
'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';
import { Loader2, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';

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

  const getStepMessage = (step: TxStep): string => {
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
  };

  return (
    <ToastContext.Provider value={{ toasts, showToast, dismissToast, showTxToast }}>
      {children}
      {/* Toast Render Component */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className="glass-panel p-4 rounded-lg shadow-lg flex gap-3 items-start animate-in slide-in-from-bottom duration-300"
          >
            <div className="mt-0.5">
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
                    <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
                  )}
                  {toast.txStep === 'confirmed' && <CheckCircle2 className="h-5 w-5 text-green-500" />}
                  {toast.txStep === 'failed' && <XCircle className="h-5 w-5 text-red-500" />}
                  {toast.txStep === 'cancelled' && <XCircle className="h-5 w-5 text-gray-500" />}
                </>
              )}
            </div>
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-foreground">{toast.title}</h4>
              {toast.message && <p className="text-xs text-muted-foreground mt-1">{toast.message}</p>}
            </div>
            <button
              onClick={() => dismissToast(toast.id)}
              className="text-muted-foreground hover:text-foreground text-xs font-bold px-1"
            >
              ×
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
