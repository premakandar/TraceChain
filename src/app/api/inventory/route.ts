export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Missing wallet address' }, { status: 400 });
    }

    // In mockDb, products are just products. We don't have a separate inventory table.
    // Let's just return products that the address manufactured or owns.
    const products = mockDb.getProducts().filter(p => 
      p.manufacturer.walletAddress === address || p.currentOwner.walletAddress === address
    );
    
    // Map it to look like the inventory model
    const inventory = products.map(p => ({
      id: `inv_${p.id}`,
      productId: p.id,
      walletAddress: address,
      product: p,
      quantity: 1,
    }));

    return NextResponse.json({ inventory });
  } catch (error: any) {
    console.error('Inventory fetch error:', error);
    return NextResponse.json({ error: error.message || 'Failed to fetch inventory' }, { status: 500 });
  }
}
