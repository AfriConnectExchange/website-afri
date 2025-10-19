
// src/app/api/auth/callback/route.ts
import { NextResponse } from 'next/server'
import { createServerClient } from "@/lib/supabase/server";

export async function GET(request: Request) {
    const requestUrl = new URL(request.url)
    const code = requestUrl.searchParams.get('code')

    if (code) {
        const supabase = createServerClient();

        // Exchange the code for a session
        const {data: sessionData, error: sessionError} = await supabase.auth.exchangeCodeForSession(code);

        if (sessionError) {
             console.error('Error exchanging code for session:', sessionError);
            return NextResponse.redirect(new URL('/auth/signin?error=auth_error', request.url));
        }

        const user = sessionData.user;
        
        if (user) {
            // Check if the user has completed onboarding
            const { data: profile, error: profileError } = await supabase
                .from('profiles')
                .select('onboarding_completed')
                .eq('id', user.id)
                .single();
            
             if (profileError && profileError.code !== 'PGRST116') { // Ignore "No rows found" error for new users
                console.error('Error fetching profile:', profileError);
            }

            if (!profile || !profile.onboarding_completed) {
                // New user or incomplete onboarding, redirect to onboarding flow
                return NextResponse.redirect(new URL('/onboarding', request.url));
            }
        }


        // If MFA is not required or already verified, proceed to app
        return NextResponse.redirect(new URL('/', request.url))
    }

    // If no code provided, redirect to login
    return NextResponse.redirect(new URL('/auth/signin', request.url))
}
