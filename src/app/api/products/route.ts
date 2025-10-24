
import { NextRequest, NextResponse } from 'next/server';
import { PrismaClient } from '@prisma/client';
import { z } from 'zod';

const prisma = new PrismaClient();

const searchSchema = z.object({
  searchQuery: z.string().optional(),
  selectedCategories: z.array(z.string()).optional(),
  minPrice: z.number().optional(),
  maxPrice: z.number().optional(),
  verifiedSellersOnly: z.boolean().optional(),
  featuredOnly: z.boolean().optional(),
  onSaleOnly: z.boolean().optional(),
  freeShippingOnly: z.boolean().optional(),
  freeListingsOnly: z.boolean().optional(),
  sortBy: z.string().optional(),
});

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const params = Object.fromEntries(searchParams.entries());

    const validatedParams = searchSchema.safeParse({
      ...params,
      selectedCategories: params.selectedCategories ? params.selectedCategories.split(',') : undefined,
      minPrice: params.minPrice ? Number(params.minPrice) : undefined,
      maxPrice: params.maxPrice ? Number(params.maxPrice) : undefined,
      verifiedSellersOnly: params.verifiedSellersOnly === 'true',
      featuredOnly: params.featuredOnly === 'true',
      onSaleOnly: params.onSaleOnly === 'true',
      freeShippingOnly: params.freeShippingOnly === 'true',
      freeListingsOnly: params.freeListingsOnly === 'true',
    });

    if (!validatedParams.success) {
      return NextResponse.json(validatedParams.error.errors, { status: 400 });
    }

    const {
      searchQuery,
      selectedCategories,
      minPrice,
      maxPrice,
      verifiedSellersOnly,
      freeListingsOnly,
      sortBy,
    } = validatedParams.data;

    const where: any = {
      isActive: true,
    };

    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { description: { contains: searchQuery, mode: 'insensitive' } },
        { tags: { has: searchQuery } },
      ];
    }

    if (selectedCategories && selectedCategories.length > 0 && !selectedCategories.includes('all')) {
      where.categoryId = { in: selectedCategories };
    }

    if (minPrice !== undefined) {
      where.price = { ...where.price, gte: minPrice };
    }

    if (maxPrice !== undefined) {
      where.price = { ...where.price, lte: maxPrice };
    }
    
    if (freeListingsOnly) {
      where.price = 0;
    }

    if (verifiedSellersOnly) {
      where.seller = {
        verificationStatus: 'verified',
      };
    }

    const orderBy: any = {};
    switch (sortBy) {
      case 'price_asc':
        orderBy.price = 'asc';
        break;
      case 'price_desc':
        orderBy.price = 'desc';
        break;
      case 'average_rating_desc':
        orderBy.averageRating = 'desc';
        break;
      case 'created_at_desc':
      default:
        orderBy.createdAt = 'desc';
        break;
    }

    const products = await prisma.product.findMany({
      where,
      orderBy,
      include: {
        seller: {
          select: {
            id: true,
            fullName: true,
            verificationStatus: true,
          },
        },
        category: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalProducts = await prisma.product.count({ where });

    const transformedProducts = products.map(p => ({
      ...p,
      name: p.title,
      rating: p.averageRating,
      reviews: p.reviewCount,
      seller: p.seller.fullName,
      sellerVerified: p.seller.verificationStatus === 'verified',
      image: (p.images as string[])[0],
      category: p.category?.name || 'Uncategorized',
      stockCount: p.quantityAvailable,
      sellerDetails: {
          id: p.seller.id,
          name: p.seller.fullName,
          isVerified: p.seller.verificationStatus === 'verified',
      }
    }));
    

    return NextResponse.json({
      products: transformedProducts,
      totalProducts,
    });
  } catch (error) {
    console.error('Failed to fetch products:', error);
    return NextResponse.json({ message: 'Internal Server Error' }, { status: 500 });
  }
}
