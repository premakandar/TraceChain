export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const product = mockDb.getProducts().find((p) => p.id === id);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Fetch related ownership logs
    const ownershipHistory = mockDb.getOwnershipLogs(id);

    // Fetch related shipments and their checkpoint updates
    const shipments = mockDb.getShipments()
      .filter((s) => s.productId === id)
      .map((shipment) => {
        const updates = mockDb.getShipmentUpdates(shipment.id);
        return {
          ...shipment,
          carrier: { name: 'Demo Carrier', walletAddress: shipment.carrierAddress },
          updates,
        };
      });

    return NextResponse.json({
      product: {
        ...product,
        ownershipHistory,
        shipments,
      },
    });
  } catch (error: any) {
    console.error('Product detail fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
