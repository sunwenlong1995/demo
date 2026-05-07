import { NextResponse } from 'next/server';

interface Shipment {
  id: string;
  externalCode: string | null;
  senderName: string;
  senderPhone: string;
  senderAddress: string;
  receiverName: string;
  receiverPhone: string;
  receiverAddress: string;
  weight: number;
  quantity: number;
  temperature: string;
  remark: string | null;
  createdAt: string;
  updatedAt: string;
}

let shipments: Shipment[] = [];

export async function POST(request: Request) {
  try {
    const data = await request.json();
    const incomingShipments = data.shipments;

    const results: { success: number; failed: number; errors: { rowIndex: number; message: string }[] } = { success: 0, failed: 0, errors: [] };

    for (const shipment of incomingShipments) {
      try {
        const existingCode = shipments.find(s => s.externalCode === shipment.externalCode && shipment.externalCode);
        if (existingCode) {
          results.failed++;
          results.errors.push({
            rowIndex: shipment._rowIndex,
            message: '外部编码已存在',
          });
          continue;
        }

        const newShipment: Shipment = {
          id: `shipment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
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
          createdAt: new Date().toISOString(),
          updatedAt: new Date().toISOString(),
        };

        shipments.push(newShipment);
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

    let filteredShipments = [...shipments];

    if (search) {
      filteredShipments = filteredShipments.filter(
        s => s.externalCode?.includes(search) || s.receiverName.includes(search)
      );
    }

    filteredShipments.sort((a, b) => {
      const aVal = a[sortBy as keyof Shipment] as string;
      const bVal = b[sortBy as keyof Shipment] as string;
      return sortOrder === 'desc' ? bVal.localeCompare(aVal) : aVal.localeCompare(bVal);
    });

    const total = filteredShipments.length;
    const paginatedShipments = filteredShipments.slice(skip, skip + limit);

    return NextResponse.json({ shipments: paginatedShipments, total, page, limit });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '服务器错误' },
      { status: 500 }
    );
  }
}
