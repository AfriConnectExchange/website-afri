// API Route to seed categories into Firestore
import { NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';

const categories = [
  { id: "textiles", name: "Textiles & Fabrics", description: "African fabrics, clothing, and textile products", icon: "👗", order: 1 },
  { id: "woodwork", name: "Woodwork & Carvings", description: "Hand-carved wooden items and sculptures", icon: "🪵", order: 2 },
  { id: "pottery", name: "Pottery & Ceramics", description: "Handmade pottery, ceramics, and clay items", icon: "🏺", order: 3 },
  { id: "jewelry", name: "Jewelry & Accessories", description: "Handcrafted jewelry and fashion accessories", icon: "💎", order: 4 },
  { id: "art", name: "Art & Paintings", description: "Original artwork, paintings, and prints", icon: "🎨", order: 5 },
  { id: "leather", name: "Leather Goods", description: "Bags, belts, wallets, and leather crafts", icon: "👜", order: 6 },
  { id: "beauty", name: "Health & Beauty", description: "Natural cosmetics, skincare, and wellness products", icon: "💄", order: 7 },
  { id: "home-decor", name: "Home & Decor", description: "Home decorations, furniture, and interior items", icon: "🏠", order: 8 },
  { id: "food-beverages", name: "Food & Beverages", description: "African food products, spices, and drinks", icon: "🍲", order: 9 },
  { id: "music-instruments", name: "Music & Instruments", description: "Traditional instruments and music items", icon: "🥁", order: 10 },
  { id: "books-media", name: "Books & Media", description: "Books, music, and educational materials", icon: "📚", order: 11 },
  { id: "services", name: "Services", description: "Professional services and skills", icon: "🛠️", order: 12 },
];

export async function POST(req: Request) {
  try {
    // Optional: Check for admin auth
    const authHeader = req.headers.get('authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.split('Bearer ')[1];
    
    try {
      await admin.auth().verifyIdToken(token);
    } catch (err) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    const db = admin.firestore();
    const batch = db.batch();

    // Add each category to Firestore
    for (const category of categories) {
      const categoryRef = db.collection('categories').doc(category.id);
      batch.set(categoryRef, {
        ...category,
        product_count: 0, // Will be updated as products are added
        created_at: admin.firestore.FieldValue.serverTimestamp(),
        updated_at: admin.firestore.FieldValue.serverTimestamp(),
        is_active: true,
      });
    }

    await batch.commit();

    return NextResponse.json({ 
      success: true, 
      message: `${categories.length} categories seeded successfully`,
      categories: categories.map(c => c.id),
    });
  } catch (error: any) {
    console.error('Error seeding categories:', error);
    return NextResponse.json({ error: error.message || 'Failed to seed categories' }, { status: 500 });
  }
}
