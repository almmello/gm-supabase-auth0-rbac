// utils/supabase.js
import { createClient } from '@supabase/supabase-js';
import logger from './logger';

export function getSupabase(accessToken) {
  logger.apiCall('Supabase', 'createClient', { url: process.env.NEXT_PUBLIC_SUPABASE_URL });
  
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