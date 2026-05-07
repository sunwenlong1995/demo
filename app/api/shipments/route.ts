import { NextResponse } from 'next/server';
import prisma from '../../../lib/prisma';

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const shipments = data.shipments;

    const results: { success: number; failed: number; errors: { rowIndex: number; message: string }[] } = { success: 0, failed: 0, errors: [] };

    for (const shipment of shipments) {
      try {
        await prisma.shipment.create({
          data: {
            externalCode: shipment.externalCode || null,
            senderName: shipment.senderName,
            senderPhone: shipment.senderPhone,
            senderAddress: shipment.senderAddress,
            receiverName: shipment.receiverName,
            receiverPhone: shipment.receiverPhone,
            receiverAddress: shipment.receiverAddress,
            weight: parseFloat(shipment.weight),
            quantity: parseInt(shipment.quantity, 10),
            temperature: shipment.temperature,
            remark: shipment.remark || null,
          },
        });
        results.success++;
      } catch (error) {
        results.failed++;
        results.errors.push({
          rowIndex: shipment._rowIndex,
          message: error instanceof Error ? error.message : '保存失败',
        });
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    );
  }
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1', 10);
    const limit = parseInt(searchParams.get('limit') || '20', 10);
    const search = searchParams.get('search') || '';
    const sortBy = searchParams.get('sortBy') || 'createdAt';
    const sortOrder = searchParams.get('sortOrder') || 'desc';

    const skip = (page - 1) * limit;

    const query: any = {
      where: {
        OR: [
          { externalCode: { contains: search } },
          { receiverName: { contains: search } },
        ],
      },
      orderBy: { [sortBy]: sortOrder },
      skip,
      take: limit,
    };

    const shipments = await prisma.shipment.findMany(query);
    const total = await prisma.shipment.count({ where: query.where });

    return NextResponse.json({ shipments, total, page, limit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    );
  }
}
