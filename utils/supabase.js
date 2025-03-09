// utils/supabase.js

import { createClient } from "@supabase/supabase-js";

const getSupabase = async (accessToken) => {
  const supabase = createClient(
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

  console.log('Supabase instance:', supabase); // Log da instância do Supabase

  return supabase;
};

export { getSupabase };
