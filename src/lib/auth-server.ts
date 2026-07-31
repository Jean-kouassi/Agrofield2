// Server-side auth helper for TanStack Start
import { createServerFn } from '@tanstack/start';
import { getSupabaseServerClient } from '../utils/supabase-server';

export const getCurrentUser = createServerFn({ method: 'GET' })
  .handler(async () => {
    const supabase = getSupabaseServerClient();
    const { data: { user }, error } = await supabase.auth.getUser();
    
    if (error || !user) {
      return null;
    }
    
    return {
      id: user.id,
      email: user.email,
      name: user.user_metadata?.full_name || user.email?.split('@')[0],
    };
  });
