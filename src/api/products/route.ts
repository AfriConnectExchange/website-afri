
'use server';
import { NextResponse } from 'next/server';
import mockProducts from '@/data/mock-products.json';
import mockCategories from '@/data/mock-categories.json';

// Type assertion for the imported mock data
const allProducts: any[] = mockProducts;

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);

  const q = searchParams.get('q');
  const categoryName = searchParams.get('category');
  const minPrice = searchParams.get('minPrice');
  const maxPrice = searchParams.get('maxPrice');
  const isFree = searchParams.get('isFree');
  const verified = searchParams.get('verified');
  const sortBy = searchParams.get('sortBy') || 'created_at_desc';
  const limit = searchParams.get('limit');

  let filteredProducts = allProducts;

  if (q) {
    filteredProducts = filteredProducts.filter(p => 
      p.title.toLowerCase().includes(q.toLowerCase()) || 
      p.description.toLowerCase().includes(q.toLowerCase())
    );
  }
  
  if (categoryName && categoryName !== 'all') {
    filteredProducts = filteredProducts.filter(p => p.category.toLowerCase() === categoryName.toLowerCase());
  }

  if (minPrice) {
    filteredProducts = filteredProducts.filter(p => p.price >= Number(minPrice));
  }
  if (maxPrice) {
    filteredProducts = filteredProducts.filter(p => p.price <= Number(maxPrice));
  }
  if (isFree === 'true') {
    filteredProducts = filteredProducts.filter(p => p.listing_type === 'freebie' || p.price === 0);
  }
  if (verified === 'true') {
    filteredProducts = filteredProducts.filter(p => p.sellerVerified === true);
  }
  
  // Sorting logic
  const [sortField, sortOrder] = sortBy.split('_');
  filteredProducts.sort((a, b) => {
    let valA = a[sortField];
    let valB = b[sortField];

    if (sortField === 'price' || sortField === 'average_rating') {
      valA = Number(valA);
      valB = Number(valB);
    }
    
    if (sortField === 'created_at') {
        valA = new Date(valA).getTime();
        valB = new Date(valB).getTime();
    }

    if (valA < valB) {
      return sortOrder === 'asc' ? -1 : 1;
    }
    if (valA > valB) {
      return sortOrder === 'asc' ? 1 : -1;
    }
    return 0;
  });

  const total = filteredProducts.length;

  if (limit) {
    filteredProducts = filteredProducts.slice(0, Number(limit));
  }
  
  // Map data to match expected frontend structure if necessary (already done in JSON)
  const mappedProducts = filteredProducts.map((p: any) => ({
    ...p,
    name: p.title,
    image: p.images?.[0] || 'https://placehold.co/400x300',
    stockCount: p.quantity_available,
    rating: p.average_rating || 0,
    reviews: p.review_count || 0,
  }));

  return NextResponse.json({ products: mappedProducts, total });
}
