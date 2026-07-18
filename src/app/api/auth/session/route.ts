export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const address = searchParams.get('address');

    if (!address) {
      return NextResponse.json({ error: 'Address is required' }, { status: 400 });
    }

    // Mock partner to bypass DB errors in Factora UI mode
    const partner = {
      walletAddress: address,
      name: 'Mock Partner',
      role: 'MANUFACTURER',
      status: 'APPROVED',
      email: 'mock@example.com'
    };

    return NextResponse.json({ partner });
  } catch (error: any) {
    console.error('Session API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
