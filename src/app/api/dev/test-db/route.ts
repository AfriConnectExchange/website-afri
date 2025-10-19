
import { NextResponse } from 'next/server';
import { createServerAdminClient } from '@/lib/supabase/serverAdminClient';

export async function POST() {
  console.log('Attempting to create test user with admin client...');
  try {
    const supabaseAdmin = await createServerAdminClient();
    const testEmail = `testuser_${Date.now()}@example.com`;
    const testUserId = crypto.randomUUID();

    const { data, error } = await supabaseAdmin
      .from('users')
      .insert({
        id: testUserId,
        auth_user_id: testUserId,
        email: testEmail,
        full_name: 'Test User',
        roles: ['buyer'],
      })
      .select()
      s.single();

    if (error) {
      console.error('Supabase admin error:', error);
      throw new Error(`Supabase error: ${error.message} (Code: ${error.code})`);
    }

    console.log('Test user created successfully:', data);
    return NextResponse.json({ success: true, message: 'Test user created successfully.', data });

  } catch (error: any) {
    console.error('API route error:', error.message);
    return NextResponse.json(
      { success: false, error: error.message || 'An unknown server error occurred.' },
      { status: 500 }
    );
  }
}
