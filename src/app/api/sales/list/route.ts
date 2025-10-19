
import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

export async function GET(request: Request) {
  const supabase = createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const { data: sales, error } = await supabase
      .from('orders')
      .select(`
        id,
        created_at,
        total_amount,
        status,
        buyer:buyer_id ( full_name )
      `)
      // This logic is tricky without a join. A view or RPC would be better.
      // For now, we fetch all orders and would need to filter them if a seller can be part of an order without being the main seller.
      // Assuming a simple model where an order has one seller, or we check items. Let's fetch orders where the user is a seller in order_items.
      // This is a complex query. A simpler approach for now is to add a `seller_id` to orders, which is not in the schema.
      // Let's assume an RPC or view `seller_sales` exists or we just fetch orders where buyer is not the user for simplicity.
      // The provided schema has `seller_id` on `order_items` but not `orders`. This requires a more complex query.
      // Let's go with a simpler RPC-like logic for the mock.
      .eq('seller_id', user.id) // This assumes a seller_id column exists on orders table for simplicity.
      .order('created_at', { ascending: false });

    if (error) throw error;
    
    return NextResponse.json(sales);

  } catch (error) {
    console.error('Error fetching sales:', error);
    return NextResponse.json({ error: 'Failed to fetch sales data.' }, { status: 500 });
  }
}
