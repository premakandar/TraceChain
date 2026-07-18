export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    // Fetch shipment details
    const shipment = await prisma.shipment.findUnique({
      where: { id: shipmentId },
    });

    if (!shipment) {
      return NextResponse.json({ error: 'Shipment not found' }, { status: 404 });
    }

    if (shipment.status === 'DELIVERED') {
      return NextResponse.json({ error: 'Shipment is already delivered and closed' }, { status: 400 });
    }

    const updatedShipment = await prisma.$transaction(async (tx: any) => {
      // 1. Create a checkpoint update record
      await tx.shipmentUpdate.create({
        data: {
          shipmentId,
          status,
          location,
          description: description || null,
          txHash,
        },
      });

      // 2. Update shipment status
      const updated = await tx.shipment.update({
        where: { id: shipmentId },
        data: { status },
      });

      // 3. Update Product status
      const productStatus = status === 'DELIVERED' ? 'DELIVERED' : 'IN_TRANSIT';
      
      await tx.product.update({
        where: { id: shipment.productId },
        data: {
          status: productStatus,
          // If delivered, transfer owner in database too
          ...(status === 'DELIVERED' ? { currentOwnerAddress: shipment.receiverAddress } : {}),
        },
      });

      // 4. If delivered, record ownership transfer and update inventory
      if (status === 'DELIVERED') {
        // Record ownership history log
        await tx.ownershipHistory.create({
          data: {
            productId: shipment.productId,
            fromAddress: shipment.senderAddress,
            toAddress: shipment.receiverAddress,
            txHash,
          },
        });

        // Remove from sender inventory
        const senderInv = await tx.inventory.findUnique({
          where: {
            walletAddress_productId: { walletAddress: shipment.senderAddress, productId: shipment.productId },
          },
        });

        if (senderInv) {
          if (senderInv.quantity <= 1) {
            await tx.inventory.delete({
              where: {
                walletAddress_productId: { walletAddress: shipment.senderAddress, productId: shipment.productId },
              },
            });
          } else {
            await tx.inventory.update({
              where: {
                walletAddress_productId: { walletAddress: shipment.senderAddress, productId: shipment.productId },
              },
              data: { quantity: senderInv.quantity - 1 },
            });
          }
        }

        // Add to receiver inventory
        await tx.inventory.upsert({
          where: {
            walletAddress_productId: { walletAddress: shipment.receiverAddress, productId: shipment.productId },
          },
          create: {
            walletAddress: shipment.receiverAddress,
            productId: shipment.productId,
            quantity: 1,
          },
          update: {
            quantity: { increment: 1 },
          },
        });
      }

      return updated;
    });

    return NextResponse.json({
      shipment: updatedShipment,
      message: `Shipment status updated to ${status}.`,
    });
  } catch (error: any) {
    console.error('Shipment update error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
