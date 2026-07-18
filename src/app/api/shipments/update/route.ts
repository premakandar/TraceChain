export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';
import { z } from 'zod';

const updateSchema = z.object({
  shipmentId: z.string().min(1),
  status: z.enum(['IN_TRANSIT', 'DELIVERED', 'CANCELLED']),
  location: z.string().min(1),
  description: z.string().optional(),
  txHash: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = updateSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { shipmentId, status, location, description, txHash } = result.data;

    // Fetch shipment from mock database
    const shipment = mockDb.getShipments().find((s) => s.id === shipmentId);

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (shipment.status === 'DELIVERED') {
      return NextResponse.json({ error: 'Shipment is already delivered and closed' }, { status: 400 });
    }

    // Update shipment status in mockDb
    shipment.status = status;

    // Add checkpoint update to mockDb
    mockDb.addShipmentUpdate({
      id: 'update_' + Math.random().toString(36).substring(2, 9),
      shipmentId,
      status,
      location,
      description: description || null,
      timestamp: new Date().toISOString(),
      txHash,
    });

    // Update Product status in mockDb
    const product = mockDb.getProducts().find((p) => p.id === shipment.productId);
    if (product) {
      product.status = status;
      if (status === 'DELIVERED') {
        product.currentOwner = {
          name: 'Demo Receiver Node',
          walletAddress: shipment.receiverAddress,
        };

        // Add ownership history log for delivered product
        mockDb.addOwnershipLog({
          id: 'log_' + Math.random().toString(36).substring(2, 9),
          productId: shipment.productId,
          fromAddress: shipment.senderAddress,
          toAddress: shipment.receiverAddress,
          timestamp: new Date().toISOString(),
          txHash,
        });
      }
    }

    return NextResponse.json({
      shipment,
      message: `Shipment status updated to ${status}.`,
    });
  } catch (error: any) {
    console.error('Shipment update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
