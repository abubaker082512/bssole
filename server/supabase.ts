import { createClient } from '@supabase/supabase-js';

// Get environment variables
const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

let supabaseAdmin: any = null;

if (supabaseUrl && supabaseKey) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseKey);
    } catch (e) {
        console.log('[SUPABASE] Init failed');
    }
}

export { supabaseAdmin };