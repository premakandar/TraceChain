'use strict';
'use client';

import React, { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Header } from '@/components/shared/Header';
import { useWallet } from '@/context/WalletContext';
import { useToast } from '@/context/ToastContext';
import { StellarService } from '@/services/stellar';
import { Package, Truck, Compass, Plus, Loader2, MapPin, CheckCircle, Clock } from 'lucide-react';

interface Shipment {
  id: string;
  productId: string;
  senderAddress: string;
  receiverAddress: string;
  source: string;
  destination: string;
  status: 'CREATED' | 'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED';
  createdAt: string;
  product: { name: string; sku: string };
  carrier: { name: string };
  updates: Array<{
    status: string;
    location: string;
    description: string | null;
    timestamp: string;
  }>;
}

export default function ShipmentsPage() {
  const { publicKey, partnerProfile, isConnected } = useWallet();
  const { showTxToast, showToast } = useToast();
  const queryClient = useQueryClient();

  // Create Shipment states
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [shipmentId, setShipmentId] = useState(() => 'ship_' + Math.random().toString(36).substring(2, 10));
  const [productId, setProductId] = useState('');
  const [senderAddress, setSenderAddress] = useState('');
  const [receiverAddress, setReceiverAddress] = useState('');
  const [source, setSource] = useState('');
  const [destination, setDestination] = useState('');

  // Update Status states
  const [selectedShipment, setSelectedShipment] = useState<Shipment | null>(null);
  const [newStatus, setNewStatus] = useState<'IN_TRANSIT' | 'DELIVERED' | 'CANCELLED'>('IN_TRANSIT');
  const [updateLocation, setUpdateLocation] = useState('');
  const [updateDescription, setUpdateDescription] = useState('');

  const [submitting, setSubmitting] = useState(false);

  // Fetch all shipments related to the wallet
  const { data, isLoading } = useQuery<{ shipments: Shipment[] }>({
    queryKey: ['shipments', publicKey],
    queryFn: async () => {
      const url = new URL('/api/shipments', window.location.origin);
      if (partnerProfile?.role === 'LOGISTICS') {
        url.searchParams.set('carrier', publicKey || '');
      } else if (partnerProfile?.role === 'MANUFACTURER') {
        url.searchParams.set('sender', publicKey || '');
      } else {
        url.searchParams.set('receiver', publicKey || '');
      }
      const res = await fetch(url.toString());
      if (!res.ok) throw new Error('Failed to load shipments');
      return res.json();
    },
    enabled: !!publicKey,
  });

  const shipments = data?.shipments || [];

  const handleCreateShipment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!publicKey || !productId || !senderAddress || !receiverAddress || !source || !destination) {
      showToast('Validation Error', 'Please fill in all fields.', 'warning');
      return;
    }

    setSubmitting(true);
    const txToast = showTxToast(`Creating shipment ${shipmentId}`);

    try {
      await StellarService.createShipment(
        shipmentId,
        productId,
        publicKey, // current carrier wallet address
        senderAddress,
        receiverAddress,
        source,
        destination,
        {
          onStepChange: (step) => {
            txToast.updateStep(step);
          },
        }
      );

      showToast('Success', 'Shipment created on Stellar successfully.', 'success');
      setShowCreateModal(false);
      // Reset form
      setProductId('');
      setSenderAddress('');
      setReceiverAddress('');
      setSource('');
      setDestination('');
      setShipmentId('ship_' + Math.random().toString(36).substring(2, 10));

      queryClient.invalidateQueries({ queryKey: ['shipments', publicKey] });
    } catch (err: any) {
      console.error(err);
      showToast('Error', err.message || 'Shipment creation failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedShipment || !updateLocation) {
      showToast('Validation Error', 'Please specify a current location.', 'warning');
      return;
    }

    setSubmitting(true);
    const txToast = showTxToast(`Updating shipment to ${newStatus}`);

    try {
      await StellarService.updateShipmentStatus(
        selectedShipment.id,
        newStatus,
        updateLocation,
        updateDescription,
        {
          onStepChange: (step) => {
            txToast.updateStep(step);
          },
        }
      );

      showToast('Success', 'Shipment status updated on Stellar successfully.', 'success');
      setSelectedShipment(null);
      setUpdateLocation('');
      setUpdateDescription('');
      queryClient.invalidateQueries({ queryKey: ['shipments', publicKey] });
    } catch (err: any) {
      console.error(err);
      showToast('Error', err.message || 'Shipment update failed.', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  const isCarrier = partnerProfile?.role === 'LOGISTICS' && partnerProfile?.status === 'APPROVED';

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col relative overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <Header />

      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-8 relative z-10">
        
        {/* Title Block */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8 pb-6 border-b border-border/30">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">Shipment Tracking</h1>
            <p className="text-sm text-muted-foreground mt-1">
              Dispatch shipments, update delivery progress, and confirm cargo arrival logs on chain
            </p>
          </div>
          {isCarrier && (
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-primary hover:bg-primary/95 text-primary-foreground font-semibold px-4 py-2.5 rounded-lg text-sm transition-all shadow-md hover:scale-[1.01]"
            >
              <Plus className="h-4 w-4" />
              Dispatch Shipment
            </button>
          )}
        </div>

        {/* Content columns */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Shipments List */}
          <div className="lg:col-span-2 space-y-4">
            <h3 className="text-lg font-bold flex items-center gap-2 mb-4">
              <Truck className="h-5 w-5 text-primary" />
              Cargo Shipments
            </h3>

            {isLoading ? (
              <div className="flex justify-center py-16">
                <Loader2 className="h-10 w-10 text-primary animate-spin" />
              </div>
            ) : shipments.length === 0 ? (
              <div className="text-center py-20 border border-dashed border-border/40 rounded-xl glass-panel flex flex-col items-center justify-center gap-4">
                <Truck className="h-12 w-12 text-muted-foreground opacity-60" />
                <p className="text-sm text-muted-foreground">No active shipments related to your wallet.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {shipments.map((ship) => (
                  <div
                    key={ship.id}
                    onClick={() => isCarrier && ship.status !== 'DELIVERED' && setSelectedShipment(ship)}
                    className={`glass-card p-6 rounded-xl border border-border/30 text-left transition-all ${
                      isCarrier && ship.status !== 'DELIVERED' ? 'cursor-pointer hover:border-primary/55' : ''
                    }`}
                  >
                    <div className="flex justify-between items-start gap-4 mb-4">
                      <div>
                        <span className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider">Shipment ID</span>
                        <h4 className="font-mono text-sm font-bold text-foreground">{ship.id}</h4>
                      </div>
                      <span
                        className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase border ${
                          ship.status === 'DELIVERED'
                            ? 'bg-green-500/10 text-green-500 border-green-500/20'
                            : ship.status === 'IN_TRANSIT'
                            ? 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20'
                            : 'bg-blue-500/10 text-blue-500 border-blue-500/20'
                        }`}
                      >
                        {ship.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-muted-foreground">Product Custody:</span>
                        <p className="font-semibold mt-0.5">{ship.product.name}</p>
                      </div>
                      <div>
                        <span className="text-muted-foreground">Route Details:</span>
                        <p className="font-semibold mt-0.5 truncate">{ship.source} → {ship.destination}</p>
                      </div>
                    </div>

                    {/* Timeline checkpoints */}
                    {ship.updates.length > 0 && (
                      <div className="mt-4 pt-4 border-t border-border/35 text-[11px] space-y-2">
                        <span className="text-muted-foreground uppercase font-bold tracking-widest text-[9px] block">Latest updates</span>
                        <div className="flex items-start gap-2">
                          <MapPin className="h-3.5 w-3.5 text-primary mt-0.5" />
                          <div>
                            <span className="font-bold text-foreground">{ship.updates[0].status}</span> - {ship.updates[0].location}
                            {ship.updates[0].description && (
                              <p className="text-muted-foreground text-[10px] mt-0.5">{ship.updates[0].description}</p>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Shipment Details / Update Form */}
          <div className="space-y-6">
            {selectedShipment ? (
              <div className="glass-card p-6 rounded-xl border border-border/40 h-fit space-y-6">
                <div className="flex justify-between items-center pb-4 border-b border-border/40">
                  <h3 className="text-lg font-bold flex items-center gap-2">
                    <Compass className="h-5 w-5 text-indigo-500" />
                    Update Progress
                  </h3>
                  <button onClick={() => setSelectedShipment(null)} className="text-xs text-muted-foreground hover:text-foreground">
                    Clear Selection
                  </button>
                </div>

                <form onSubmit={handleUpdateStatus} className="space-y-4">
                  <div className="space-y-2">
                    <span className="text-xs text-muted-foreground block">Active Cargo ID</span>
                    <span className="font-mono text-sm font-semibold">{selectedShipment.id}</span>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                      Target Status
                    </label>
                    <select
                      value={newStatus}
                      onChange={(e: any) => setNewStatus(e.target.value)}
                      className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs focus:outline-none"
                    >
                      <option value="IN_TRANSIT">In Transit / Checkpoint</option>
                      <option value="DELIVERED">Confirm Cargo Delivery</option>
                      <option value="CANCELLED">Cancel Shipment</option>
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                      Current Location
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Frankfurt Airport Hub"
                      value={updateLocation}
                      onChange={(e) => setUpdateLocation(e.target.value)}
                      required
                      className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80 font-mono"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                      Status Log Note (Optional)
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. Cargo processed at customs"
                      value={updateDescription}
                      onChange={(e) => setUpdateDescription(e.target.value)}
                      className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs focus:outline-none focus:border-primary/80"
                    />
                  </div>

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full bg-primary hover:bg-primary/95 text-primary-foreground font-semibold py-2.5 rounded-lg text-sm transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? 'Submitting update...' : 'Publish Update'}
                  </button>
                </form>
              </div>
            ) : (
              <div className="glass-card p-6 rounded-xl border border-border/40 text-center py-12 text-muted-foreground">
                <Truck className="h-10 w-10 text-muted-foreground opacity-60 mx-auto mb-4" />
                <h4 className="font-bold text-sm">Select Active Shipment</h4>
                <p className="text-xs text-muted-foreground mt-2 max-w-[200px] mx-auto">
                  As an approved Carrier, select any active cargo in the list to update its location checkpoint or confirm final delivery.
                </p>
              </div>
            )}
          </div>

        </div>
      </main>

      {/* Dispatch Shipment Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="glass-panel max-w-md w-full p-8 rounded-2xl border border-border/40 shadow-2xl relative animate-in fade-in zoom-in-95 duration-200">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              <Truck className="h-5 w-5 text-primary" />
              Dispatch Shipment
            </h3>
            <p className="text-xs text-muted-foreground mb-6"> mint cargo track files on Stellar blockchain</p>

            <form onSubmit={handleCreateShipment} className="space-y-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Shipment ID (Generated)
                </label>
                <input
                  type="text"
                  value={shipmentId}
                  onChange={(e) => setShipmentId(e.target.value)}
                  required
                  className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                  Product Hash ID
                </label>
                <input
                  type="text"
                  placeholder="e.g. prod_012x..."
                  value={productId}
                  onChange={(e) => setProductId(e.target.value)}
                  required
                  className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Sender Address
                  </label>
                  <input
                    type="text"
                    placeholder="Stellar Key"
                    value={senderAddress}
                    onChange={(e) => setSenderAddress(e.target.value)}
                    required
                    className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Receiver Address
                  </label>
                  <input
                    type="text"
                    placeholder="Stellar Key"
                    value={receiverAddress}
                    onChange={(e) => setReceiverAddress(e.target.value)}
                    required
                    className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs font-mono focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Source Hub
                  </label>
                  <input
                    type="text"
                    placeholder="Warehouse A"
                    value={source}
                    onChange={(e) => setSource(e.target.value)}
                    required
                    className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground block">
                    Destination Hub
                  </label>
                  <input
                    type="text"
                    placeholder="Retail Outlet B"
                    value={destination}
                    onChange={(e) => setDestination(e.target.value)}
                    required
                    className="w-full bg-secondary/20 border border-border/45 rounded-lg px-4 py-2.5 text-xs focus:outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 bg-secondary hover:bg-secondary/80 text-foreground py-2 rounded-lg text-xs border border-border/40"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 bg-primary hover:bg-primary/95 text-primary-foreground py-2 rounded-lg text-xs transition-all shadow-md"
                >
                  {submitting ? 'Dispatching...' : 'Dispatch'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
