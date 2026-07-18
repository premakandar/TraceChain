import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const syncSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(2),
  sku: z.string().min(2),
  description: z.string().optional(),
  manufacturerAddress: z.string().min(56).max(56),
  txHash: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = syncSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { id, name, sku, description, manufacturerAddress, txHash } = result.data;

    // Check if manufacturer exists and is approved
    const manufacturer = await prisma.partner.findUnique({
      where: { walletAddress: manufacturerAddress },
    });

    if (!manufacturer || manufacturer.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Manufacturer not registered or not approved' }, { status: 400 });
    }

    // Use transaction to atomically create product, ownership history, and inventory
    const product = await prisma.$transaction(async (tx) => {
      // Create product
      const prod = await tx.product.create({
        data: {
          id,
          name,
          sku,
          description: description || null,
          manufacturerAddress,
          currentOwnerAddress: manufacturerAddress,
          status: 'REGISTERED',
          txHash,
        },
      });

      // Add to ownership history
      await tx.ownershipHistory.create({
        data: {
          productId: id,
          fromAddress: manufacturerAddress, // Self-created
          toAddress: manufacturerAddress,
          txHash,
        },
      });

      // Add to inventory
      await tx.inventory.create({
        data: {
          walletAddress: manufacturerAddress,
          productId: id,
          quantity: 1,
        },
      });

      return prod;
    });

    return NextResponse.json({ product, message: 'Product synchronized successfully.' });
  } catch (error: any) {
    console.error('Product sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
