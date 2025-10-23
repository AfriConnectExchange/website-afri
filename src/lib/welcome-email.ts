// Supabase removed — sendWelcomeEmail is a no-op fallback to avoid runtime errors
// in other parts of the app that call it. If you want to re-enable sending
// welcome emails, implement a provider that doesn't rely on Supabase here.
export async function sendWelcomeEmail(userId: string) {
  // Keep a log for visibility in case callers expect side effects.
  // This intentionally does not throw.
  // eslint-disable-next-line no-console
  console.warn('sendWelcomeEmail skipped: Supabase backend removed. userId=', userId);
  return;
}
