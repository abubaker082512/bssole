import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL as string || process.env.SUPABASE_URL as string;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY as string || process.env.SUPABASE_ANON_KEY as string;
// Using Service Role Key is recommended for admin API bypassing RLS
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || supabaseKey;

export const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);
