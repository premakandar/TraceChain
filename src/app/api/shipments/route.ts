export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const whereClause: any = {};

    if (carrier) whereClause.carrierAddress = carrier;
    if (sender) whereClause.senderAddress = sender;
    if (receiver) whereClause.receiverAddress = receiver;
    if (status) whereClause.status = status;
    if (productId) whereClause.productId = productId;

    const shipments = await prisma.shipment.findMany({
      where: whereClause,
      include: {
        product: {
          select: { name: true, sku: true },
        },
        carrier: {
          select: { name: true },
        },
        updates: {
          orderBy: { timestamp: 'desc' },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ shipments });
  } catch (error: any) {
    console.error('Shipments list fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
