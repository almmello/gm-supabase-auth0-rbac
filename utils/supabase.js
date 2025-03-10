// utils/supabase.js
import { createClient } from '@supabase/supabase-js';

export function getSupabase(accessToken) {
  // Retorna o objeto SupabaseClient diretamente
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      global: {
        headers: {
          Authorization: `Bearer ${accessToken}`,
        },
      },
    }
  );
}