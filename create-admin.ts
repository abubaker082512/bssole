import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://mxnlpduykpaurnhwxvoc.supabase.co';
const SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmxwZHV5a3BhdXJuaHd4dm9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3MzY2MiwiZXhwIjoyMDkwNTQ5NjYyfQ.Hcs4pAMm7z3tNLaCWC4VBq4yEopQqz5cOYp-ZQA_CC8';

// Uses the Service Role key — bypasses all RLS, server-side only
const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

async function createAdmin() {
  console.log('Creating admin user...');

  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'adminbssole@gmail.com',
    password: '@Admin12345',
    email_confirm: true, // Skip the email confirmation step
    user_metadata: { role: 'admin' }
  });

  if (error) {
    if (error.message.includes('already registered') || error.message.includes('already been registered')) {
      console.log('✅ Admin user already exists — no action needed.');
    } else {
      console.error('❌ Error creating admin:', error.message);
    }
    return;
  }

  console.log('✅ Admin user created successfully!');
  console.log('   Email:   adminbssole@gmail.com');
  console.log('   User ID:', data.user?.id);
}

createAdmin();
