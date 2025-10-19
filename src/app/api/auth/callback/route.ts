
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
      // Check if user exists in our public.users table
      const { data: appUser, error: appUserError } = await supabase
        .from('users')
        .select('id, onboarding_completed:user_onboarding_progress(walkthrough_completed)')
        .eq('id', user.id)
        .single();
        
      if (appUserError && appUserError.code !== 'PGRST116') {
        console.error('Error fetching app user:', appUserError);
      }

      // If user does not exist, create them
      if (!appUser) {
        const { error: insertError } = await supabase.from('users').insert({
          id: user.id,
          email: user.email,
          full_name: user.user_metadata.full_name,
          profile_picture_url: user.user_metadata.avatar_url,
          // Default role from schema
          roles: ['buyer'], 
        });

        if (insertError) {
          console.error('Error creating user profile:', insertError);
          // Redirect to an error page or show an error
           return NextResponse.redirect(new URL('/auth/signin?error=user_creation_failed', request.url));
        }
      }
      
      // Log the sign-in activity
      await logActivity({
          user_id: user.id,
          action: 'user_signed_in',
          entity_type: 'user_session',
          entity_id: user.id,
          ip_address: request.headers.get('x-forwarded-for'),
          user_agent: request.headers.get('user-agent'),
      });

      // Check if onboarding is complete from the user_onboarding_progress table
      // The type assertion is a bit of a workaround for Supabase's complex generated types.
      const onboardingProgress = (appUser?.onboarding_completed as any)?.[0];

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
