import '@supabase/supabase-js';

declare module '@supabase/supabase-js' {
  // Augment the User type to include application-specific fields the codebase expects.
  interface User {
    fullName?: string;
    full_name?: string;
    avatarUrl?: string;
    avatar_url?: string;
    roles?: string[];
    // keep role as optional string too (existing library field)
    role?: string;
  }
}
