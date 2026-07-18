export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';

// GET /api/notifications - Fetch notifications for a specific wallet address
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    const notifications = mockDb.getNotifications(address);

    return NextResponse.json({ notifications });
  } catch (error: any) {
    console.error('Notifications fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
