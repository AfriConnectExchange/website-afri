
import { NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { logActivity } from '@/lib/activity-logger';

export async function GET(request: Request) {
  const requestUrl = new URL(request.url);
  const code = requestUrl.searchParams.get('code');

  if (code) {
    const supabase = createServerClient();
    const { data: sessionData, error: sessionError } =
      await supabase.auth.exchangeCodeForSession(code);

    if (sessionError) {
      console.error('Error exchanging code for session:', sessionError);
      return NextResponse.redirect(
        new URL('/auth/signin?error=auth_error', request.url)
      );
    }

    const user = sessionData.user;

    if (user) {
      // The handle_new_user trigger in the database will create the user record
      // in public.users if it doesn't exist.

      await logActivity({
          user_id: user.id,
          action: 'user_signed_in',
          entity_type: 'user_session',
          entity_id: user.id,
          ip_address: request.headers.get('x-forwarded-for'),
          user_agent: request.headers.get('user-agent'),
      });

      // Check if onboarding is complete from the user_onboarding_progress table
      const { data: onboardingProgress, error: onboardingError } = await supabase
        .from('user_onboarding_progress')
        .select('walkthrough_completed')
        .eq('user_id', user.id)
        .single();
      
      if (onboardingError && onboardingError.code !== 'PGRST116') { // Ignore 'no rows found'
          console.error('Error fetching onboarding progress:', onboardingError);
      }

      if (!onboardingProgress || !onboardingProgress.walkthrough_completed) {
        // New user or incomplete onboarding, redirect to onboarding flow
        return NextResponse.redirect(new URL('/onboarding', request.url));
      }
    }

    // Existing user with completed onboarding, redirect to the app
    return NextResponse.redirect(new URL('/', request.url));
  }

  // If no code is provided, redirect to login
  return NextResponse.redirect(new URL('/auth/signin', request.url));
}
