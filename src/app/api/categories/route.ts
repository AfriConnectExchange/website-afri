
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function GET(req: NextRequest) {
  try {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
      include: {
        _count: {
          select: {
            products: true,
          },
        },
      },
      orderBy: {
        displayOrder: 'asc',
      },
    });

    const transformedCategories = categories.map(c => ({
      id: c.id,
      name: c.name,
      count: c._count.products,
    }));

    return NextResponse.json(transformedCategories);
  } catch (error) {
    console.error('Failed to fetch categories:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
