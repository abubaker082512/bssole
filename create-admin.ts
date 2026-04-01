import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://mxnlpduykpaurnhwxvoc.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmxwZHV5a3BhdXJuaHd4dm9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3MzY2MiwiZXhwIjoyMDkwNTQ5NjYyfQ.Hcs4pAMm7z3tNLaCWC4VBq4yEopQqz5cOYp-ZQA_CC8';

const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey);

async function createAdmin() {
  const { data, error } = await supabaseAdmin.auth.admin.createUser({
    email: 'adminbssole@gmail.com',
    password: '@Admin12345',
    email_confirm: true
  });

  if (error) {
    console.error('Error creating admin user:', error.message);
    process.exit(1);
  } else {
    console.log('Admin user created successfully:', data.user.email);
    process.exit(0);
  }
}

createAdmin();
