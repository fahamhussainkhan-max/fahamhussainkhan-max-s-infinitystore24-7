import { createClient } from '@supabase/supabase-js';

// Project reference: egdbegaujzrzsbbstzsr
export const SUPABASE_URL = 'https://egdbegaujzrzsbbstzsr.supabase.co';
export const SUPABASE_PUBLISHABLE_KEY = 'sb_publishable_NFG335bM--1HEo9Mx27mmA_Rcw4qF_Q';

export const supabase = createClient(
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  {
    auth: {
      persistSession: false,
    },
  }
);

export default supabase;
