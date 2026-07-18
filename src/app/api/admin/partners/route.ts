import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

// GET /api/admin/partners - List all partners (with optional status filter)
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status') || undefined;

    const partners = await prisma.partner.findMany({
      where: status ? { status: status as any } : {},
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json({ partners });
  } catch (error: any) {
    console.error('Admin partners fetch error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
