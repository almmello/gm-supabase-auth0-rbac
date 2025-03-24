// utils/supabase.js
import { createClient } from '@supabase/supabase-js';
import logger from './logger';

let supabaseClient = null;

export async function getSupabase(accessToken) {
  if (!supabaseClient) {
    supabaseClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
          detectSessionInUrl: false
        }
      }
    );
  }

  // Atualiza o header de autorização com o novo token
  supabaseClient.rest.headers = {
    Authorization: `Bearer ${accessToken}`
  };

  return supabaseClient;
}