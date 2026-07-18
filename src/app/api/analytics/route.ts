import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(request: NextRequest) {
  try {
    const productsCount = await prisma.product.count();
    const activeShipmentsCount = await prisma.shipment.count({
      where: {
        status: { in: ['CREATED', 'IN_TRANSIT'] },
      },
    });
    const completedShipmentsCount = await prisma.shipment.count({
      where: {
        status: 'DELIVERED',
      },
    });
    const transfersCount = await prisma.ownershipHistory.count();

    // Group products by status
    const statusGroups = await prisma.product.groupBy({
      by: ['status'],
      _count: {
        id: true,
      },
    });

    const productsByStatus = statusGroups.map((group: any) => ({
      status: group.status,
      count: group._count.id,
    }));

    // Group partners by role
    const partnerGroups = await prisma.partner.groupBy({
      by: ['role', 'status'],
      _count: {
        walletAddress: true,
      },
    });

    const partnersByRole = partnerGroups.map((group: any) => ({
      role: group.role,
      status: group.status,
      count: group._count.walletAddress,
    }));

    // Top Manufacturers
    const manufacturers = await prisma.product.groupBy({
      by: ['manufacturerAddress'],
      _count: {
        id: true,
      },
      orderBy: {
        _count: {
          id: 'desc',
        },
      },
      take: 5,
    });

    // Populate manufacturer names
    const topManufacturers = await Promise.all(
      manufacturers.map(async (m: any) => {
        const partner = await prisma.partner.findUnique({
          where: { walletAddress: m.manufacturerAddress },
          select: { name: true },
        });
        return {
          name: partner?.name || 'Unknown Manufacturer',
          address: m.manufacturerAddress,
          count: m._count.id,
        };
      })
    );

    return NextResponse.json({
      metrics: {
        totalProducts: productsCount,
        activeShipments: activeShipmentsCount,
        completedShipments: completedShipmentsCount,
        totalTransfers: transfersCount,
      },
      productsByStatus,
      partnersByRole,
      topManufacturers,
    });
  } catch (error: any) {
    console.error('Analytics aggregation error:', error);
    return NextResponse.json({ error: error.message || 'Internal Server Error' }, { status: 500 });
  }
}
