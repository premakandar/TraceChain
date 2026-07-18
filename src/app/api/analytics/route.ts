export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { mockDb } from '@/lib/mockDb';

export async function GET(request: NextRequest) {
  try {
    // Use dynamic in-memory db
    const analytics = mockDb.getAnalytics();
    
    return NextResponse.json({
      ...analytics,
      partnersByRole: [
        { role: 'MANUFACTURER', status: 'APPROVED', count: 12 },
        { role: 'DISTRIBUTOR', status: 'APPROVED', count: 34 },
        { role: 'LOGISTICS', status: 'APPROVED', count: 8 },
        { role: 'RETAILER', status: 'APPROVED', count: 145 },
      ],
      topManufacturers: [
        { name: 'Global Tech Corp', address: 'G...A1B2', count: 540 },
        { name: 'Apex Electronics', address: 'G...C3D4', count: 320 },
        { name: 'Nexus Innovations', address: 'G...E5F6', count: 210 },
      ],
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
