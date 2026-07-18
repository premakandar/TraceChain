export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';

// GET /api/admin/partners - List all partners (with optional status filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    let partners = mockDb.getPartners();
    if (status) {
      partners = partners.filter(p => p.status === status);
    }

    return NextResponse.json({ partners });
  } catch (error: any) {
    console.error('Admin partners fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
