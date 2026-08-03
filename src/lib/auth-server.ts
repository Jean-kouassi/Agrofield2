// Client-side auth helper (compatible with @tanstack/react-start)
import { supabase } from '@/integrations/supabase/client';

export async function getCurrentUser() {
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return {
    id: user.id,
    email: user.email,
    name: user.user_metadata?.full_name || user.email?.split('@')[0],
  };
}
