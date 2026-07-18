export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { z } from 'zod';

const registerSchema = z.object({
  walletAddress: z.string().min(56).max(56), // Stellar public key is 56 chars
  name: z.string().min(2).max(100),
  role: z.enum(['MANUFACTURER', 'DISTRIBUTOR', 'LOGISTICS', 'RETAILER', 'CONSUMER']),
  email: z.string().email().optional().or(z.literal('')),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = registerSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json({ error: result.error.format() }, { status: 400 });
    }

    const { walletAddress, name, role, email } = result.data;

    // Check if partner already exists
    const existing = await prisma.partner.findUnique({
      where: { walletAddress },
    });

    if (existing) {
      return NextResponse.json({ error: 'Partner already registered with this wallet' }, { status: 400 });
    }

    // Auto-approve as ADMIN if it matches env var
    const isAdmin = process.env.ADMIN_WALLET_ADDRESS && walletAddress === process.env.ADMIN_WALLET_ADDRESS;
    const finalRole = isAdmin ? 'ADMIN' : role;
    const status = isAdmin || finalRole === 'CONSUMER' ? 'APPROVED' : 'PENDING';

    const partner = await prisma.partner.create({
      data: {
        walletAddress,
        name: isAdmin ? 'Platform Administrator' : name,
        role: finalRole as any,
        status,
        email: email || null,
      },
    });

    return NextResponse.json({ partner, message: 'Registration request submitted successfully.' });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
