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

    // Mock DB response for Factora UI demonstration
    const partner = {
      walletAddress,
      name,
      role: role,
      status: 'APPROVED',
      email: email || null,
    };

    return NextResponse.json({ partner, message: 'Registration request submitted successfully.' });
  } catch (error: any) {
    console.error('Registration API Error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
