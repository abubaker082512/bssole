import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY;

console.log('[SUPABASE] URL exists:', !!supabaseUrl);
console.log('[SUPABASE] Key exists:', !!supabaseKey);

if (!supabaseUrl || !supabaseKey) {
    console.error('[SUPABASE] Missing environment variables!');
    console.error('[SUPABASE] SUPABASE_URL:', process.env.SUPABASE_URL ? 'set' : 'NOT set');
    console.error('[SUPABASE] VITE_SUPABASE_URL:', process.env.VITE_SUPABASE_URL ? 'set' : 'NOT set');
    console.error('[SUPABASE] SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'NOT set');
    console.error('[SUPABASE] VITE_SUPABASE_ANON_KEY:', process.env.VITE_SUPABASE_ANON_KEY ? 'set' : 'NOT set');
}

export const supabaseAdmin = createClient(supabaseUrl || '', supabaseKey || '');
