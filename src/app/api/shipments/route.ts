export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';
import { z } from 'zod';

const querySchema = z.object({
  carrier: z.string().optional(),
  sender: z.string().optional(),
  receiver: z.string().optional(),
  status: z.enum(['CREATED', 'IN_TRANSIT', 'DELIVERED', 'CANCELLED']).optional(),
  productId: z.string().optional(),
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      carrier: searchParams.get('carrier') || undefined,
      sender: searchParams.get('sender') || undefined,
      receiver: searchParams.get('receiver') || undefined,
      status: searchParams.get('status') || undefined,
      productId: searchParams.get('productId') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { carrier, sender, receiver, status, productId } = parsed.data;

    let shipments = mockDb.getShipments();

    if (carrier) shipments = shipments.filter(s => s.carrierAddress === carrier);
    if (sender) shipments = shipments.filter(s => s.senderAddress === sender);
    if (receiver) shipments = shipments.filter(s => s.receiverAddress === receiver);
    if (status) shipments = shipments.filter(s => s.status === status);
    if (productId) shipments = shipments.filter(s => s.productId === productId);

    // Map relationships
    const enrichedShipments = shipments.map((s) => {
      const product = mockDb.getProducts().find(p => p.id === s.productId);
      const updates = mockDb.getShipmentUpdates(s.id);
      return {
        ...s,
        product: product ? { name: product.name, sku: product.sku } : { name: 'Unknown Product', sku: '—' },
        carrier: { name: 'Demo Carrier' },
        updates,
      };
    });

    return NextResponse.json({ shipments: enrichedShipments });
  } catch (error: any) {
    console.error('Shipments list fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
