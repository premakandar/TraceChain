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

    const whereClause: any = {};

    if (owner) {
      whereClause.currentOwnerAddress = owner;
    }
    if (manufacturer) {
      whereClause.manufacturerAddress = manufacturer;
    }
    if (status) {
      whereClause.status = status;
    }
    if (search) {
      whereClause.OR = [
        { id: { contains: search, mode: 'insensitive' } },
        { name: { contains: search, mode: 'insensitive' } },
        { sku: { contains: search, mode: 'insensitive' } },
        { description: { contains: search, mode: 'insensitive' } },
      ];
    }

    const products = await prisma.product.findMany({
      where: whereClause,
      include: {
        manufacturer: {
          select: { name: true, walletAddress: true },
        },
        currentOwner: {
          select: { name: true, walletAddress: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ products });
  } catch (error: any) {
    console.error('Products fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
