export const dynamic = 'force-dynamic';

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

import { mockDb } from '@/lib/mockDb';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = syncSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { id, name, sku, description, manufacturerAddress, txHash } = result.data;

    // Use mockDb instead of Prisma
    const product = {
      id,
      name,
      sku,
      description: description || '',
      status: 'REGISTERED',
      price: '0.00',
      createdAt: new Date().toISOString(),
      manufacturer: { name: 'Demo Manufacturer', walletAddress: manufacturerAddress },
      currentOwner: { name: 'Demo Manufacturer', walletAddress: manufacturerAddress },
    };

    mockDb.addProduct(product);

    return NextResponse.json({ product, message: 'Product synchronized successfully.' });
  } catch (error: any) {
    console.error('Product sync error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
