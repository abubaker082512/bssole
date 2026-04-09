import { createClient } from '@supabase/supabase-js';

// Safely get environment variables - handle undefined gracefully
function getEnvVar(key: string): string | undefined {
    if (typeof process === 'undefined') return undefined;
    return process.env?.[key];
}

const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

let initialized = false;
let supabaseAdmin: any;

// Only create client if we have both values
if (supabaseUrl && supabaseKey && supabaseUrl.includes('supabase')) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        initialized = true;
    } catch (e: any) {
        console.log('[SUPABASE] Init failed:', e?.message);
    }
}

export const isInitialized = initialized;
export { supabaseAdmin };