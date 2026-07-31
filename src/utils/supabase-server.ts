// Supabase Server Client for TanStack Start SSR
import { createServerClient, type CookieOptions } from '@supabase/ssr';

export function getSupabaseServerClient() {
  // These need to be accessed in a server context
  const supabaseUrl = import.meta.env.PUBLIC_SUPABASE_URL;
  const supabaseKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing Supabase environment variables');
  }

  return createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      get(name: string) {
        // In server context, cookies are not available the same way
        // This is a simplified version for basic auth checks
        return undefined;
      },
      set(name: string, value: string, options: CookieOptions) {
        // Server-side cookie setting would go here
      },
      remove(name: string, options: CookieOptions) {
        // Server-side cookie removal
      },
    },
  });
}
