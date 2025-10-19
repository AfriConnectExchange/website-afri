
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export async function GET() {
  const supabase = createServerClient();
  const { data: { session } } = await supabase.auth.getSession();
  const user = session?.user;

  if (!user) {
    return NextResponse.json({ isAuthenticated: false, onboardingComplete: false });
  }

  try {
    const { data: profile, error } = await supabase
        .from('users')
        .select('verification_status') // A field that indicates onboarding is done
        .eq('id', user.id)
        .single();
    
    if (error && error.code !== 'PGRST116') {
        console.error('Error fetching profile for session status:', error);
        // Fallback to not onboarding complete if profile fetch fails for unexpected reasons
        return NextResponse.json({ isAuthenticated: true, onboardingComplete: false });
    }

    const onboardingComplete = profile?.verification_status === 'verified';

    return NextResponse.json({ isAuthenticated: true, onboardingComplete });

  } catch (error) {
    // Session cookie is invalid or expired.
    return NextResponse.json({ isAuthenticated: false, onboardingComplete: false });
  }
}
