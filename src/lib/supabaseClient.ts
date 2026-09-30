import { supabase, SUPABASE_URL, SUPABASE_ANON_KEY } from './supabase';
import { SupabaseClient } from '@supabase/supabase-js';

export const SUPABASE_PUBLISHABLE_KEY = SUPABASE_ANON_KEY;
export { supabase, SUPABASE_URL };
export default supabase as SupabaseClient;

