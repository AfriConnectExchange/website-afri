
import { NextRequest, NextResponse } from 'next/server';
import admin from '@/lib/firebaseAdmin';
import { verifyAdminRequest } from '@/lib/admin-auth';
import { logActivity } from '@/lib/activity-logger';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const adminUser = await verifyAdminRequest(req);
    if (!adminUser) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const { id } = params;
    const { status } = await req.json();

    if (!id || !status || !['active', 'rejected', 'inactive'].includes(status)) {
        return NextResponse.json({ success: false, error: 'Invalid product ID or status' }, { status: 400 });
    }

    const productRef = admin.firestore().collection('products').doc(id);
    const updateData: Record<string, any> = { status, updated_at: new Date().toISOString() };

    if (status === 'active') {
        updateData.published_at = new Date().toISOString();
    }

    await productRef.update(updateData);

    await logActivity({
        user_id: adminUser.uid || adminUser.username,
        action: `product_${status}`,
        entity_type: 'product',
        entity_id: id,
        changes: { new_status: status },
    });

    return NextResponse.json({ success: true, message: `Product status updated to ${status}` });

  } catch (error: any) {
    return NextResponse.json({ success: false, error: error.message }, { status: 500 });
  }
}
