// API Route to fetch all categories
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const db = admin.firestore();
    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get('includeCounts') === 'true';
    
    // Fetch categories - only filter by is_active if the field exists
    const categoriesSnapshot = await db
      .collection('categories')
      .get();

    const categories = categoriesSnapshot.docs
      .map(doc => ({
        id: doc.id,
        ...doc.data(),
      }))
      .filter((cat: any) => cat.is_active !== false); // Only exclude explicitly inactive ones

    // Optionally add product counts for each category
    if (includeCounts) {
      const categoriesWithCounts = await Promise.all(
        categories.map(async (category) => {
          const productsSnapshot = await db
            .collection('products')
            .where('category_id', '==', category.id)
            .where('status', '==', 'active')
            .count()
            .get();
          
          return {
            ...category,
            count: productsSnapshot.data().count || 0,
          };
        })
      );
      
      return NextResponse.json({ categories: categoriesWithCounts });
    }

    return NextResponse.json({ categories });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch categories',
      categories: [] 
    }, { status: 500 });
  }
}
