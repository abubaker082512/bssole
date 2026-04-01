import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = "https://mxnlpduykpaurnhwxvoc.supabase.co";
const SERVICE_ROLE = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im14bmxwZHV5a3BhdXJuaHd4dm9jIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3NDk3MzY2MiwiZXhwIjoyMDkwNTQ5NjYyfQ.Hcs4pAMm7z3tNLaCWC4VBq4yEopQqz5cOYp-ZQA_CC8";

const supabase = createClient(SUPABASE_URL, SERVICE_ROLE);

async function createAdmin() {
    console.log("Creating admin user...");
    const { data, error } = await supabase.auth.admin.createUser({
        email: 'adminbssole@gmail.com',
        password: '@Admin12345',
        email_confirm: true
    });

    if (error) {
        if (error.status === 422 && error.message.includes('already registered')) {
            console.log("Admin user already registered!");
            return;
        }
        console.error("Error creating user:", error);
    } else {
        console.log("Successfully created admin user:", data.user.email);
    }
}

createAdmin();
