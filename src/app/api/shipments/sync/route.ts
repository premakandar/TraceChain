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

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = syncSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { id, productId, carrierAddress, senderAddress, receiverAddress, source, destination, txHash } = result.data;

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product does not exist' }, { status: 400 });
    }

    // Check carrier exists and is approved LOGISTICS provider
    const carrier = await prisma.partner.findUnique({
      where: { walletAddress: carrierAddress },
    });

    if (!carrier || carrier.role !== 'LOGISTICS' || carrier.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Carrier is not an approved logistics provider' }, { status: 400 });
    }

    // Perform atomic transaction
    const shipment = await prisma.$transaction(async (tx: any) => {
      // 1. Create shipment
      const ship = await tx.shipment.create({
        data: {
          id,
          productId,
          carrierAddress,
          senderAddress,
          receiverAddress,
          source,
          destination,
          status: 'CREATED',
          txHash,
        },
      });

      // 2. Add initial checkpoint update
      await tx.shipmentUpdate.create({
        data: {
          shipmentId: id,
          status: 'CREATED',
          location: source,
          description: 'Shipment created and scheduled for dispatch.',
          txHash,
        },
      });

      // 3. Update product status
      await tx.product.update({
        where: { id: productId },
        data: {
          status: 'IN_TRANSIT',
        },
      });

      return ship;
    });

    return NextResponse.json({ shipment, message: 'Shipment created and synchronized.' });
  } catch (error: any) {
    console.error('Shipment sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
