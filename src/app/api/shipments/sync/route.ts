export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const syncSchema = z.object({
  id: z.string().min(1),
  productId: z.string().min(1),
  carrierAddress: z.string().min(56).max(56),
  senderAddress: z.string().min(56).max(56),
  receiverAddress: z.string().min(56).max(56),
  source: z.string().min(1),
  destination: z.string().min(1),
  txHash: z.string().min(1),
});

import { mockDb } from '@/lib/mockDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = syncSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { id, productId, carrierAddress, senderAddress, receiverAddress, source, destination, txHash } = result.data;

    // Use mockDb
    const shipment = {
      id,
      productId,
      carrierAddress,
      senderAddress,
      receiverAddress,
      source,
      destination,
      status: 'CREATED',
      createdAt: new Date().toISOString(),
      txHash,
    };

    mockDb.addShipment(shipment);

    return NextResponse.json({ shipment, message: 'Shipment created and synchronized.' });
  } catch (error: any) {
    console.error('Shipment sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
