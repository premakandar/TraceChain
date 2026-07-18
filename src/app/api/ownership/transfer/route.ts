import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const transferSchema = z.object({
  productId: z.string().min(1),
  fromAddress: z.string().min(56).max(56),
  toAddress: z.string().min(56).max(56),
  txHash: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = transferSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { productId, fromAddress, toAddress, txHash } = result.data;

    // Check product exists
    const product = await prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    if (product.currentOwnerAddress !== fromAddress) {
      return NextResponse.json({ error: 'Sender does not currently own this product' }, { status: 400 });
    }

    // Check recipient exists and is approved
    const recipient = await prisma.partner.findUnique({
      where: { walletAddress: toAddress },
    });

    if (!recipient || recipient.status !== 'APPROVED') {
      return NextResponse.json({ error: 'Recipient is not a registered/approved supply chain partner' }, { status: 400 });
    }

    // Perform atomic state updates
    const updatedProduct = await prisma.$transaction(async (tx: any) => {
      // 1. Update product owner
      const updated = await tx.product.update({
        where: { id: productId },
        data: {
          currentOwnerAddress: toAddress,
        },
      });

      // 2. Add history log
      await tx.ownershipHistory.create({
        data: {
          productId,
          fromAddress,
          toAddress,
          txHash,
        },
      });

      // 3. Move inventory
      // Decrement/delete sender inventory
      const existingSenderInv = await tx.inventory.findUnique({
        where: {
          walletAddress_productId: { walletAddress: fromAddress, productId },
        },
      });

      if (existingSenderInv) {
        if (existingSenderInv.quantity <= 1) {
          await tx.inventory.delete({
            where: {
              walletAddress_productId: { walletAddress: fromAddress, productId },
            },
          });
        } else {
          await tx.inventory.update({
            where: {
              walletAddress_productId: { walletAddress: fromAddress, productId },
            },
            data: {
              quantity: existingSenderInv.quantity - 1,
            },
          });
        }
      }

      // Increment/upsert recipient inventory
      await tx.inventory.upsert({
        where: {
          walletAddress_productId: { walletAddress: toAddress, productId },
        },
        create: {
          walletAddress: toAddress,
          productId,
          quantity: 1,
        },
        update: {
          quantity: { increment: 1 },
        },
      });

      return updated;
    });

    return NextResponse.json({
      product: updatedProduct,
      message: 'Ownership transfer registered successfully.',
    });
  } catch (error: any) {
    console.error('Ownership transfer error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
