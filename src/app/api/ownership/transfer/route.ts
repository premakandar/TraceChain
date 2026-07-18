export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';
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

    // Check product exists in mock database
    const products = mockDb.getProducts();
    const product = products.find((p) => p.id === productId);

    if (!product) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    // Perform state updates in mock database
    product.currentOwner = {
      name: 'Demo Recipient Node',
      walletAddress: toAddress,
    };

    // Add ownership history log
    mockDb.addOwnershipLog({
      id: 'log_' + Math.random().toString(36).substring(2, 9),
      productId,
      fromAddress,
      toAddress,
      timestamp: new Date().toISOString(),
      txHash,
    });

    return NextResponse.json({
      product,
      message: 'Ownership transfer registered successfully.',
    });
  } catch (error: any) {
    console.error('Ownership transfer error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
