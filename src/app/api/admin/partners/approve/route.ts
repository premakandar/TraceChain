import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
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

    const partner = await prisma.partner.update({
      where: { walletAddress },
      data: { status },
    });

    // Create a notification for the approved partner
    await prisma.notification.create({
      data: {
        walletAddress,
        title: approve ? 'Account Approved' : 'Account Rejected',
        message: approve
          ? `Your business registration request as ${partner.role} has been approved by the administrator.`
          : `Your business registration request as ${partner.role} has been rejected.`,
      },
    });

    return NextResponse.json({
      partner,
      message: `Partner status updated to ${status} successfully.`,
    });
  } catch (error: any) {
    console.error('Admin approval error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
