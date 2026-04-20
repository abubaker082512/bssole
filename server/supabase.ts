import { createClient } from '@supabase/supabase-js';

// Safely get environment variables - handle undefined gracefully
function getEnvVar(key: string): string | undefined {
    if (typeof process === 'undefined') return undefined;
    return process.env?.[key];
}

const supabaseUrl = getEnvVar('SUPABASE_URL') || getEnvVar('VITE_SUPABASE_URL');
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY') || getEnvVar('VITE_SUPABASE_ANON_KEY') || getEnvVar('SUPABASE_ANON_KEY');

console.log('[SUPABASE] URL:', supabaseUrl ? 'SET' : 'NOT SET');
console.log('[SUPABASE] KEY:', supabaseKey ? 'SET' : 'NOT SET');

let initialized = false;
let supabaseAdmin: any = null;

// Only create client if we have both values
if (supabaseUrl && supabaseKey) {
    try {
        supabaseAdmin = createClient(supabaseUrl, supabaseKey);
        initialized = true;
        console.log('[SUPABASE] Client initialized successfully');
    } catch (e: any) {
        console.log('[SUPABASE] Init failed:', e?.message);
        supabaseAdmin = null;
    }
} else {
    console.log('[SUPABASE] Missing credentials, client not initialized');
}

// Export the initialized flag and supabaseAdmin instance
export const isInitialized = initialized;
export { supabaseAdmin };