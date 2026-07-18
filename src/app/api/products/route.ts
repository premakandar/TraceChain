export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const querySchema = z.object({
  owner: z.string().optional(),
  manufacturer: z.string().optional(),
  status: z.enum(['REGISTERED', 'IN_TRANSIT', 'DELIVERED', 'SOLD']).optional(),
  search: z.string().optional(),
});

import { mockDb } from '@/lib/mockDb';

// GET /api/products - Lists products with filtering and search
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = querySchema.safeParse({
      owner: searchParams.get('owner') || undefined,
      manufacturer: searchParams.get('manufacturer') || undefined,
      status: searchParams.get('status') || undefined,
      search: searchParams.get('search') || undefined,
    });

    if (!parsed.success) {
      return NextResponse.json({ error: parsed.error.format() }, { status: 400 });
    }

    const { owner, manufacturer, status, search } = parsed.data;

    let products = mockDb.getProducts();

    if (owner) {
      products = products.filter(p => p.currentOwner.walletAddress === owner);
    }
    if (manufacturer) {
      products = products.filter(p => p.manufacturer.walletAddress === manufacturer);
    }
    if (status) {
      products = products.filter(p => p.status === status);
    }
    if (search) {
      const s = search.toLowerCase();
      products = products.filter(p => 
        p.id.toLowerCase().includes(s) || 
        p.name.toLowerCase().includes(s) || 
        p.sku.toLowerCase().includes(s) || 
        p.description.toLowerCase().includes(s)
      );
    }

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
