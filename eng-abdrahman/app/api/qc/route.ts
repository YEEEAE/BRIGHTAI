import { NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

export const dynamic = 'force-dynamic';

// Generate client if needed
const prisma = new PrismaClient();

export async function GET() {
    try {
        const data = await prisma.qCRecord.findMany({
            orderBy: { date: 'asc' }
        });
        return NextResponse.json(data);
    } catch (error) {
        console.error('Database Error:', error);
        return NextResponse.json({ error: 'Failed to fetch quality records' }, { status: 500 });
    }
}
