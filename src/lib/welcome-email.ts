import { createServerClient } from './supabase/server';

// When running inside Next's App Router build, importing server-only modules
// like `react-dom/server` at module scope can cause the bundler to error.
// Use dynamic imports inside the function so the server-only code is only
// loaded at runtime on the server.
export async function sendWelcomeEmail(userId: string) {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  let targetUser: any = null;

  if (user && user.id === userId) {
    targetUser = user;
  } else {
    // Fetch user record via admin client to get profile details
    try {
      const supabaseAdmin = await import('@/lib/supabase/serverAdminClient').then(m => m.createServerAdminClient());
      const { data, error: fetchErr } = await (supabaseAdmin as any)
        .from('users')
        .select('id, email, full_name')
        .eq('id', userId)
        .limit(1)
        .single();

      if (fetchErr) {
        console.error('Failed to fetch user for welcome email:', fetchErr);
        return;
      }
      targetUser = data;
    } catch (e) {
      console.error('Failed to load admin client for welcome email:', e);
      return;
    }
  }

  if (!targetUser || !targetUser.email) {
    console.warn('No email available for user, skipping welcome email:', userId);
    return;
  }

  try {
    // Dynamically import rendering and template modules at runtime (server only)
    const [react, rds, WelcomeEmailMod, emailService] = await Promise.all([
      import('react'),
      import('react-dom/server'),
      import('@/emails/WelcomeEmail'),
      import('./email-service'),
    ]);

    const WelcomeEmail = (WelcomeEmailMod && (WelcomeEmailMod.default || WelcomeEmailMod)) as any;
    const renderToStaticMarkup = (rds as any).renderToStaticMarkup as (el: any) => string;

    const name = targetUser.full_name || undefined;
    const html = renderToStaticMarkup(react.createElement(WelcomeEmail, { name }));

    await (emailService as any).sendEmail({
      to: targetUser.email,
      subject: 'Welcome to AfriConnect Exchange',
      text: `Welcome ${name || ''} to AfriConnect Exchange! Complete your profile to get started: https://app.africonnect.exchange/onboarding`,
      html,
      // extra metadata used by email-service when persisting logs
      templateName: 'welcome_email',
      metadata: { userId },
    } as any);
  } catch (e) {
    console.error('Failed to render or send welcome email:', e);
  }
}
