export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { mockDb } from '@/lib/mockDb';
import { z } from 'zod';

const approveSchema = z.object({
  walletAddress: z.string().min(56).max(56),
  approve: z.boolean(),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = approveSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { walletAddress, approve } = result.data;

    const status = approve ? 'APPROVED' : 'REJECTED';

    mockDb.updatePartnerStatus(walletAddress, status);

    const partner = mockDb.getPartners().find(p => p.walletAddress === walletAddress);

    return NextResponse.json({
      partner,
      message: `Partner status updated to ${status} successfully.`,
    });
  } catch (error: any) {
    console.error('Admin approval error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
