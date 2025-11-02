// API Route to fetch all categories
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

export async function GET(request: Request) {
  try {
    const db = admin.firestore();
    const { searchParams } = new URL(request.url);
    const includeCounts = searchParams.get('includeCounts') === 'true';
    const hierarchical = searchParams.get('hierarchical') === 'true';
    
    // Fetch categories - only filter by is_active if the field exists
    const categoriesSnapshot = await db
      .collection('categories')
      .get();

    const raw = categoriesSnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as any) }));
    const categories = raw.filter((cat: any) => cat.is_active !== false);

    if (hierarchical) {
      // Build parent -> children map
      const byParent: Record<string, any[]> = {};
      categories.forEach((cat: any) => {
        const parentId = cat.parent_id || 'ROOT';
        if (!byParent[parentId]) byParent[parentId] = [];
        byParent[parentId].push(cat);
      });

      const buildTree = (parentId: string | null): any[] => {
        const key = parentId || 'ROOT';
        return (byParent[key] || []).map((cat: any) => ({
          ...cat,
          children: buildTree(cat.id),
        }));
      };

      let tree = buildTree(null);

      // Optionally add counts per category id
      if (includeCounts) {
        tree = await Promise.all(tree.map(async (cat: any) => {
          let count = 0;
          try {
            const productsSnapshot = await db
              .collection('products')
              .where('category_id', '==', cat.id)
              .where('status', '==', 'active')
              .count()
              .get();
            count = productsSnapshot.data().count || 0;
          } catch {}
          return { ...cat, count };
        }));
      }

      return NextResponse.json({ categories: tree });
    }

    // Optionally add product counts for each category
    if (includeCounts) {
      const categoriesWithCounts = await Promise.all(
        categories
          .filter((c: any) => !c.parent_id) // top-level only by default
          .map(async (category) => {
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

    // Default: top-level categories only
    const topLevel = categories.filter((c: any) => !c.parent_id);
    return NextResponse.json({ categories: topLevel });
  } catch (error: any) {
    console.error('Error fetching categories:', error);
    return NextResponse.json({ 
      error: error.message || 'Failed to fetch categories',
      categories: [] 
    }, { status: 500 });
  }
}
